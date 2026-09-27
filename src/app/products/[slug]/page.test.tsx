// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/domain/entities/product/Product";

const cart = vi.hoisted(() => ({
  cart: null,
  addItem: vi.fn<(product: Product, quantity: number) => Promise<boolean>>(async () => true),
  pending: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products/kit-72h",
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/presentation/context/AnalyticsContext", () => ({
  useAnalytics: () => ({ track: vi.fn(), captureException: vi.fn(), setConsent: vi.fn() }),
}));

vi.mock("@/presentation/context/CartContext", () => ({
  useCart: () => cart,
}));

import ProductPage from "./page";

const renderProduct = async (slug: string) => render(await ProductPage({ params: Promise.resolve({ slug }) }));

describe("/products/[slug]", () => {
  beforeEach(() => {
    cart.addItem.mockClear();
  });

  it("lets the visitor pick the number of people, updating the price and the item added", async () => {
    const user = userEvent.setup();
    await renderProduct("kit-72h");

    expect(screen.getByRole("heading", { level: 1, name: "Kit 72h" })).toBeInTheDocument();
    const people = screen.getByRole("group", { name: "Número de personas" });
    expect(within(people).getAllByRole("radio").map((radio) => radio.closest("label")?.textContent)).toEqual([
      "1 persona",
      "2 personas",
      "4 personas",
    ]);
    expect(within(people).getByRole("radio", { name: "1 persona" })).toBeChecked();
    expect(screen.getByText("119,00 €")).toBeInTheDocument();

    await user.click(within(people).getByRole("radio", { name: "2 personas" }));

    expect(screen.getByText("199,00 €")).toBeInTheDocument();
    expect(screen.queryByText("119,00 €")).toBeNull();
    const specs = screen.getByRole("table", { name: "Ficha técnica" });
    expect(within(specs).getByRole("row", { name: /Para/ })).toHaveTextContent("2 personas");
    expect(within(specs).getByRole("row", { name: /Peso/ })).toHaveTextContent("5,4 kg");

    await user.click(screen.getByRole("button", { name: "Añadir al carrito" }));
    expect(cart.addItem).toHaveBeenCalledWith(expect.objectContaining({ variantTitle: "2 personas" }), 1);
    expect(cart.addItem.mock.calls[0][0].id.value).toBe("kit-72h-2p");
  });

  it("lists the full contents with links to the products sold separately, and the cross-sell", async () => {
    await renderProduct("kit-72h");
    const contents = screen.getByRole("region", { name: "Contenido completo" });
    expect(within(contents).getByRole("link", { name: "Radio solar" })).toHaveAttribute("href", "/products/radio-solar");
    expect(within(contents).getByText("Ración alimentaria (3 días)")).toBeInTheDocument();
    expect(within(contents).getByText(/Cantidades del kit para 1 persona/)).toBeInTheDocument();
    const crossSell = screen.getByRole("region", { name: "Añade productos" });
    expect(within(crossSell).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Lámpara de camping",
      "Mochila de supervivencia 65L",
    ]);
    expect(screen.getByRole("link", { name: /Ver la comparativa de kits/ })).toHaveAttribute("href", "/how-to-choose");
    expect(screen.getByText("Foto del kit cerrado próximamente")).toBeInTheDocument();
  });

  it("explains the build-your-own kit and prices it as a starting point", async () => {
    await renderProduct("kit-custom");
    expect(screen.getByRole("heading", { level: 2, name: "¿Cómo funciona el Kit Custom?" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Número de personas" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Contenido completo" })).toBeNull();
    expect(screen.getByText("Desde")).toBeInTheDocument();
  });

  it("links a loose product to the kits that include it", async () => {
    await renderProduct("manta-termica");
    // The first list is the product's own; the related cards below have theirs.
    const [included] = screen.getAllByRole("list", { name: "Incluido en" });
    expect(within(included).getByRole("link", { name: "Incluido en el Kit 24h" })).toHaveAttribute("href", "/products/kit-24h");
    expect(within(included).getByRole("link", { name: "Incluido en el Kit 72h" })).toHaveAttribute("href", "/products/kit-72h");
    expect(screen.getByRole("img", { name: "Manta térmica" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Número de personas" })).toBeNull();
  });
});
