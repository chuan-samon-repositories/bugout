// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { builderBases, builderGroups, builderPresets } from "@/application/catalog";
import { BusinessRuleError } from "@/domain/errors";
import { getContainer, resetContainer } from "@/infrastructure/config";
import { toProductSnapshot } from "@/presentation/components/catalog/productSnapshot";
import { useCart } from "@/presentation/context/CartContext";
import { KitBuilder } from "./KitBuilder";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/products/kit-custom",
  useSearchParams: () => new URLSearchParams(),
}));

/** Shows what the cart holds and whether its drawer is open, as the page's header and drawer would. */
function CartProbe() {
  const { cart, isOpen } = useCart();
  const lines = cart?.getItems().map((item) => `${item.product.slug}×${item.quantity.value}`) ?? [];
  return (
    <output data-testid="cart" data-open={isOpen}>
      {lines.join(" ")}
    </output>
  );
}

async function renderBuilder() {
  const catalog = await getContainer().getGetProductsUseCase().execute();
  const kit = catalog.find((product) => product.slug === "kit-custom");
  if (!kit) throw new Error("Missing kit-custom fixture");
  const user = userEvent.setup();
  render(
    <Providers>
      <KitBuilder
        kitSlug={kit.slug}
        bases={builderBases(kit, catalog).map(toProductSnapshot)}
        groups={builderGroups(kit, catalog).map((group) => ({
          category: group.category,
          products: group.products.map(toProductSnapshot),
        }))}
        presets={builderPresets(kit, catalog)}
      />
      <CartProbe />
    </Providers>,
  );
  const summary = screen.getByRole("complementary", { name: "Tu kit" });
  const addButton = within(summary).getByRole("button", { name: "Añadir al carrito" });
  await waitFor(() => expect(addButton).not.toBeDisabled());
  return { user, summary, addButton };
}

const cartLines = () => screen.getByTestId("cart").textContent;

describe("KitBuilder", () => {
  beforeEach(() => {
    localStorage.clear();
    resetContainer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds the backpack and the chosen products to the cart at once, then starts over", async () => {
    const track = vi.spyOn(getContainer().getAnalyticsService(), "track");
    const { user, summary, addButton } = await renderBuilder();

    // The first backpack is chosen from the start.
    expect(within(summary).getByText("59,00 €", { normalizer: (text) => text.replace(/\s+/g, " ") })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /65L/ }));
    await user.click(screen.getByRole("button", { name: "Añadir una unidad de Frontal" }));
    await user.click(screen.getByRole("button", { name: "Añadir una unidad de Frontal" }));
    await user.click(screen.getByRole("button", { name: "Añadir una unidad de Manta térmica" }));
    await user.click(screen.getByRole("button", { name: "Añadir una unidad de Manta térmica" }));
    await user.click(screen.getByRole("button", { name: "Quitar una unidad de Manta térmica" }));

    expect(summary).toHaveTextContent("3 productos · 4 unidades");
    // 89 + 2 × 14 + 6
    expect(summary).toHaveTextContent(/123,00\s€/);
    // Free shipping starts at 75 €.
    expect(summary).toHaveTextContent("Tienes envío estándar gratis");

    await user.click(addButton);

    await waitFor(() => expect(cartLines()).toBe("mochila-65l×1 manta-termica×1 frontal×2"));
    expect(screen.getByTestId("cart")).toHaveAttribute("data-open", "true");
    expect(summary).toHaveTextContent("Hemos añadido 3 productos al carrito.");
    // Starts over without the backpack, which is in the cart already.
    expect(screen.getByRole("radio", { name: /Ya tengo mochila/ })).toBeChecked();
    expect(summary).toHaveTextContent(/0,00\s€/);
    expect(addButton).toHaveAttribute("aria-disabled", "true");

    const added = track.mock.calls.map(([event]) => event).filter((event) => event.name === "product_added_to_cart");
    expect(added).toHaveLength(3);
    expect(added.every((event) => event.name === "product_added_to_cart" && event.properties.source === "kit_builder")).toBe(true);
    expect(track).toHaveBeenCalledWith({
      name: "kit_builder_added_to_cart",
      properties: expect.objectContaining({
        kit_slug: "kit-custom",
        line_count: 3,
        unit_count: 4,
        base_slug: "mochila-65l",
        preset_slug: null,
        cart_value: 123,
      }),
    });
  });

  it("starts from a ready-made kit's contents and says what it cannot add", async () => {
    const { user, summary } = await renderBuilder();
    await user.click(screen.getByRole("radio", { name: /Ya tengo mochila/ }));
    await user.click(screen.getByRole("button", { name: "Partir del Kit 72h" }));

    // The Kit 72h includes the 30L backpack, so it is chosen again.
    expect(screen.getByRole("radio", { name: /30L/ })).toBeChecked();
    expect(screen.getByRole("button", { name: "Partir del Kit 72h" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Hemos marcado el contenido del Kit 72h/)).toBeInTheDocument();
    expect(screen.getByText(/No se venden por separado o están agotados: .*Ración alimentaria \(3 días\)/)).toBeInTheDocument();
    expect(screen.getByText("Unidades de Manta térmica:").parentElement).toHaveTextContent("2");
    expect(summary).not.toHaveTextContent("Todavía no has elegido nada.");

    await user.click(screen.getByRole("button", { name: "Vaciar la selección" }));
    expect(screen.getByText("Unidades de Manta térmica:").parentElement).toHaveTextContent("0");
    expect(screen.queryByText(/Hemos marcado el contenido/)).toBeNull();
    // Only the backpack is left.
    expect(summary).toHaveTextContent("1 producto · 1 unidad");
  });

  it("keeps the button focusable but inert while nothing is chosen", async () => {
    const add = vi.spyOn(getContainer().getManageCartUseCase(), "addManyToCart");
    const { user, summary, addButton } = await renderBuilder();
    await user.click(screen.getByRole("radio", { name: /Ya tengo mochila/ }));

    expect(summary).toHaveTextContent("Todavía no has elegido nada.");
    expect(addButton).toHaveAttribute("aria-disabled", "true");
    expect(addButton).toHaveAccessibleDescription("Elige al menos un producto para añadirlo al carrito.");
    await user.click(addButton);
    expect(add).not.toHaveBeenCalled();
    expect(screen.getByTestId("cart")).toHaveAttribute("data-open", "false");
  });

  it("adds what it can and names each product that could not be added", async () => {
    const manageCart = getContainer().getManageCartUseCase();
    const original = manageCart.addManyToCart.bind(manageCart);
    vi.spyOn(manageCart, "addManyToCart").mockImplementation(async (items) => {
      const update = await original(items.filter(({ productId }) => productId.value !== "frontal"));
      return {
        ...update,
        failures: [{ productId: "frontal", error: new BusinessRuleError("OUT_OF_STOCK", "sold out") }],
      };
    });
    const { user, summary, addButton } = await renderBuilder();
    await user.click(screen.getByRole("button", { name: "Añadir una unidad de Frontal" }));
    await user.click(addButton);

    await waitFor(() => expect(cartLines()).toBe("mochila-30l×1"));
    expect(await screen.findByText("Frontal está agotado.")).toBeInTheDocument();
    expect(summary).toHaveTextContent("Hemos añadido 1 producto al carrito.");
  });
});
