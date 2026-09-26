// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { getContainer, resetContainer } from "@/infrastructure/config";
import { useCart } from "@/presentation/context/CartContext";
import { CartDrawer } from "./CartDrawer";

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function OpenButton() {
  const { openCart } = useCart();
  return (
    <button type="button" onClick={openCart}>
      Abrir
    </button>
  );
}

function storeCart(items: { productId: string; quantity: number }[]) {
  localStorage.setItem("bugout.cart", JSON.stringify({ version: 2, items }));
}

async function openDrawer() {
  const user = userEvent.setup();
  render(
    <Providers>
      <OpenButton />
      <CartDrawer />
    </Providers>,
  );
  await user.click(screen.getByRole("button", { name: "Abrir" }));
  const dialog = screen.getByRole("dialog", { name: "Tu carrito" });
  await waitFor(() => expect(within(dialog).queryByRole("status")).toBeNull());
  return { user, dialog };
}

describe("CartDrawer", () => {
  beforeEach(() => {
    localStorage.clear();
    resetContainer();
    router.push.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a load error with a retry instead of an empty cart when the cart cannot be loaded", async () => {
    vi.spyOn(getContainer().getAnalyticsService(), "captureException");
    const getCart = vi.spyOn(getContainer().getManageCartUseCase(), "getCart").mockRejectedValueOnce(new Error("offline"));
    storeCart([{ productId: "first-aid-pro", quantity: 2 }]);
    const { user, dialog } = await openDrawer();

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("No hemos podido cargar tu carrito.");
    expect(within(dialog).queryByText("Tu carrito está vacío.")).toBeNull();

    await user.click(within(alert).getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(within(dialog).getAllByRole("listitem")).toHaveLength(1));
    expect(getCart).toHaveBeenCalledTimes(2);
    expect(within(dialog).queryByRole("alert")).toBeNull();
  });

  it("shows an empty state with a link to the catalog", async () => {
    const { dialog } = await openDrawer();
    expect(within(dialog).getByText("Tu carrito está vacío.")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Ver productos" })).toHaveAttribute("href", "/products");
    expect(within(dialog).queryByRole("button", { name: "Finalizar compra" })).toBeNull();
  });

  it("renders lines with prices, stepper labels and the free-shipping progress", async () => {
    storeCart([{ productId: "water-purification-kit", quantity: 1 }]);
    const { dialog } = await openDrawer();

    const lines = within(dialog).getAllByRole("listitem");
    expect(lines).toHaveLength(1);
    const line = lines[0];
    expect(within(line).getByRole("link", { name: "Kit de potabilización de agua" })).toHaveAttribute(
      "href",
      "/products/water-purification-kit",
    );
    expect(within(line).getByRole("button", { name: "Reducir cantidad de Kit de potabilización de agua" })).toBeDisabled();
    expect(within(line).getByRole("button", { name: "Aumentar cantidad de Kit de potabilización de agua" })).toBeEnabled();
    expect(within(line).getByRole("button", { name: "Eliminar Kit de potabilización de agua del carrito" })).toBeEnabled();
    expect(within(dialog).getByText(/Te faltan 36,00\s€ para el envío estándar gratis/)).toBeInTheDocument();
    expect(within(dialog).getByText("IVA incluido. El envío se calcula al finalizar la compra.")).toBeInTheDocument();
  });

  it("updates quantities and reports free shipping once reached", async () => {
    storeCart([{ productId: "water-purification-kit", quantity: 1 }]);
    const { user, dialog } = await openDrawer();

    await user.click(within(dialog).getByRole("button", { name: "Aumentar cantidad de Kit de potabilización de agua" }));

    await waitFor(() => expect(within(dialog).getByText("Cantidad:").parentElement).toHaveTextContent("Cantidad: 2"));
    expect(within(dialog).getByText("Tienes envío estándar gratis")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Reducir cantidad de Kit de potabilización de agua" })).toBeEnabled();
  });

  it("removes a line", async () => {
    storeCart([
      { productId: "water-purification-kit", quantity: 1 },
      { productId: "first-aid-pro", quantity: 2 },
    ]);
    const { user, dialog } = await openDrawer();

    await user.click(within(dialog).getByRole("button", { name: "Eliminar Kit de potabilización de agua del carrito" }));

    await waitFor(() => expect(within(dialog).getAllByRole("listitem")).toHaveLength(1));
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("empties the cart only after an inline confirmation", async () => {
    storeCart([{ productId: "first-aid-pro", quantity: 2 }]);
    const { user, dialog } = await openDrawer();

    await user.click(within(dialog).getByRole("button", { name: "Vaciar carrito" }));
    expect(within(dialog).getByText("¿Seguro que quieres vaciar el carrito?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(1);

    await user.click(within(dialog).getByRole("button", { name: "Vaciar carrito" }));
    await user.click(within(dialog).getByRole("button", { name: "Sí, vaciar" }));

    expect(await within(dialog).findByText("Tu carrito está vacío.")).toBeInTheDocument();
  });

  it("starts the checkout and closes with Seguir comprando", async () => {
    storeCart([{ productId: "first-aid-pro", quantity: 1 }]);
    const { user, dialog } = await openDrawer();

    await user.click(within(dialog).getByRole("button", { name: "Finalizar compra" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/checkout"));
    expect(screen.queryByRole("dialog", { name: "Tu carrito" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await user.click(screen.getByRole("button", { name: "Seguir comprando" }));
    expect(screen.queryByRole("dialog", { name: "Tu carrito" })).toBeNull();
  });
});
