// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { ProductCard } from "./ProductCard";

const cart = vi.hoisted(() => ({ addItem: vi.fn(async () => true), pending: false }));

vi.mock("@/presentation/context/CartContext", () => ({
  useCart: () => cart,
}));

describe("ProductCard", () => {
  it("has a single link to the product page, named after the product and used as heading", () => {
    const product = buildProduct({
      id: "mochila-30l",
      name: "Mochila de supervivencia 30L",
      price: 59,
      originalPrice: 69,
      badge: "PREMIUM",
    });
    render(<ProductCard product={product} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/products/mochila-30l");
    expect(links[0]).toHaveAccessibleName("Mochila de supervivencia 30L");
    expect(screen.getByRole("heading", { level: 2, name: "Mochila de supervivencia 30L" })).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.queryByText("Agotado")).toBeNull();
  });

  it("adds a single-variant product to the cart from the card", async () => {
    const user = userEvent.setup();
    const product = buildProduct({ id: "silbato", name: "Silbato", price: 5 });
    render(<ProductCard product={product} />);

    await user.click(screen.getByRole("button", { name: "Añadir Silbato al carrito" }));

    expect(cart.addItem).toHaveBeenCalledWith(expect.objectContaining({ slug: "silbato" }), 1, "product_card");
  });

  it("lists the kits that include the product", () => {
    render(<ProductCard product={buildProduct({ name: "Manta" })} includedIn={["Kit 24h", "Kit 72h"]} />);
    const list = screen.getByRole("list", { name: "Incluido en" });
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Incluido en el Kit 24h",
      "Incluido en el Kit 72h",
    ]);
  });

  it("shows a starting price and no quick add for kits sold in several sizes", () => {
    const kit = buildProduct({
      id: "kit-24h",
      name: "Kit 24h",
      variants: [
        { id: "kit-24h-1p", title: "1 persona", price: 39 },
        { id: "kit-24h-2p", title: "2 personas", price: 69 },
      ],
    });
    const { container } = render(<ProductCard product={kit} />);
    expect(screen.getByText("Desde 39,00 €")).toBeInTheDocument();
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("shows a build-your-own kit base as a starting price, with a decorative placeholder", () => {
    const custom = buildProduct({
      id: "kit-custom",
      name: "Kit Custom",
      price: 59,
      details: { features: [], specifications: [], contents: [], kit: { label: "CUSTOM", buildYourOwn: true } },
    });
    const { container } = render(<ProductCard product={custom} />);
    expect(screen.getByText("Desde 59,00 €")).toBeInTheDocument();
    // The heading names the card: the label box is not a second, redundant image.
    expect(screen.queryByRole("img", { name: "Kit Custom" })).toBeNull();
    expect(container.querySelector("[data-kit-placeholder]")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Añadir Kit Custom al carrito" })).toBeInTheDocument();
  });

  it("supports a level-3 heading for use under a section heading", () => {
    render(<ProductCard product={buildProduct({ name: "Kit" })} headingLevel={3} />);
    expect(screen.getByRole("heading", { level: 3, name: "Kit" })).toBeInTheDocument();
  });

  it("labels out-of-stock products and offers no quick add", () => {
    const { container } = render(<ProductCard product={buildProduct({ inStock: false })} />);
    expect(within(container).getByText("Agotado")).toBeInTheDocument();
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("hides ratings when there are no reviews", () => {
    render(<ProductCard product={buildProduct({ rating: null })} />);
    expect(screen.queryByRole("img", { name: /Valoración/ })).toBeNull();
  });
});
