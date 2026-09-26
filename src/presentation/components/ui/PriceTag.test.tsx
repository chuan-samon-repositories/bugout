// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Money } from "@/domain/value-objects/Money";
import { formatMoney } from "@/presentation/i18n";
import { discountPercent, PriceTag } from "./PriceTag";

const eur = (amount: number) => Money.fromMajor(amount, "EUR");

describe("PriceTag", () => {
  it("formats the price with formatMoney", () => {
    const { container } = render(<PriceTag price={eur(199)} />);
    expect(formatMoney(eur(199))).toBe("199,00 €");
    expect(container).toHaveTextContent("199,00 €");
    expect(container.querySelector("s")).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("shows the struck-through original price and discount chip when on sale", () => {
    const { container } = render(<PriceTag price={eur(159)} originalPrice={eur(199)} />);
    expect(container.querySelector("s")).toHaveTextContent("199,00 €");
    expect(screen.getByText("Precio anterior:", { exact: false })).toHaveClass("sr-only");
    expect(screen.getByText("-20%")).toBeInTheDocument();
    expect(screen.getByText("20 % de descuento")).toHaveClass("sr-only");
  });

  it("never shows a zero or negative discount", () => {
    const { container, rerender } = render(<PriceTag price={eur(199)} originalPrice={eur(149)} />);
    expect(container.querySelector("s")).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();

    rerender(<PriceTag price={eur(199)} originalPrice={eur(199)} />);
    expect(container.querySelector("s")).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();

    rerender(<PriceTag price={eur(199)} originalPrice={null} />);
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("computes rounded discount percentages", () => {
    expect(discountPercent(eur(79), eur(99))).toBe(20);
    expect(discountPercent(eur(99), eur(79))).toBe(0);
    expect(discountPercent(eur(99), Money.fromMajor(120, "USD"))).toBe(0);
  });
});
