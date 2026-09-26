// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { ProductCard } from "./ProductCard";

describe("ProductCard", () => {
  it("is a single link to the product page with the name as heading", () => {
    const product = buildProduct({
      id: "72h-survival-backpack",
      name: "Mochila de supervivencia 72H",
      price: 299,
      originalPrice: 399,
      badge: "PREMIUM",
    });
    const { container } = render(<ProductCard product={product} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/products/72h-survival-backpack");
    expect(links[0]).toHaveAccessibleName("Mochila de supervivencia 72H");
    expect(screen.getByRole("heading", { level: 2, name: "Mochila de supervivencia 72H" })).toBeInTheDocument();
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.queryByText("Agotado")).toBeNull();
  });

  it("supports a level-3 heading for use under a section heading", () => {
    render(<ProductCard product={buildProduct({ name: "Kit" })} headingLevel={3} />);
    expect(screen.getByRole("heading", { level: 3, name: "Kit" })).toBeInTheDocument();
  });

  it("labels out-of-stock products", () => {
    const { container } = render(<ProductCard product={buildProduct({ inStock: false })} />);
    expect(within(container).getByText("Agotado")).toBeInTheDocument();
  });

  it("hides ratings when there are no reviews", () => {
    render(<ProductCard product={buildProduct({ rating: null })} />);
    expect(screen.queryByRole("img", { name: /Valoración/ })).toBeNull();
  });
});
