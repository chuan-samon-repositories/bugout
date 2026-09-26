// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductBadge } from "./ProductBadge";

describe("ProductBadge", () => {
  it.each([
    ["BESTSELLER", "Más vendido"],
    ["PREMIUM", "Premium"],
    ["SALE", "Oferta"],
    ["sale", "Oferta"],
  ])("translates %s", (badge, label) => {
    render(<ProductBadge badge={badge} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("renders unknown badges verbatim in a neutral style", () => {
    render(<ProductBadge badge="Nuevo" />);
    expect(screen.getByText("Nuevo")).toHaveClass("bg-sand");
  });

  it("renders nothing for an empty badge", () => {
    const { container } = render(<ProductBadge badge="  " />);
    expect(container).toBeEmptyDOMElement();
  });
});
