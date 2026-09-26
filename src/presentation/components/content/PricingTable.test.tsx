// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { Money } from "@/domain/value-objects/Money";
import { testPricingPolicy } from "@/domain/testing/testPricingPolicy";
import { PricingTable } from "./PricingTable";

const eur = (amount: number) => Money.fromMajor(amount, "EUR");

function rowFor(name: string): HTMLElement {
  const header = screen.getByRole("rowheader", { name });
  return header.closest("tr") as HTMLElement;
}

describe("PricingTable", () => {
  it("lists every shipping rate with formatted prices, free-from text and delivery days", () => {
    render(<PricingTable policy={testPricingPolicy} />);

    const table = screen.getByRole("table", { name: "Tarifas de envío (IVA incluido)" });
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Modalidad",
      "Precio",
      "Plazo de entrega estimado",
    ]);

    const standard = within(rowFor("Estándar"));
    expect(standard.getByText("4,95 €")).toBeInTheDocument();
    expect(standard.getByText("Gratis a partir de 75,00 €")).toBeInTheDocument();
    expect(standard.getByText("De 3 a 5 días laborables")).toBeInTheDocument();

    const express = within(rowFor("Urgente"));
    expect(express.getByText("9,95 €")).toBeInTheDocument();
    expect(express.queryByText(/Gratis/)).not.toBeInTheDocument();
    expect(express.getByText("De 1 a 2 días laborables")).toBeInTheDocument();

    const overnight = within(rowFor("24 horas"));
    expect(overnight.getByText("14,95 €")).toBeInTheDocument();
    expect(overnight.getByText("1 día laborable")).toBeInTheDocument();
  });

  it("follows the policy instead of fixed amounts", () => {
    const policy: PricingPolicy = {
      ...testPricingPolicy,
      shippingRates: [{ id: "standard", price: eur(3.5), freeFrom: eur(50), deliveryDays: { min: 2, max: 4 } }],
    };
    render(<PricingTable policy={policy} />);

    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("3,50 €")).toBeInTheDocument();
    expect(screen.getByText("Gratis a partir de 50,00 €")).toBeInTheDocument();
    expect(screen.getByText("De 2 a 4 días laborables")).toBeInTheDocument();
  });

  it("wraps the table in a focusable, labelled scroll region", () => {
    render(<PricingTable policy={testPricingPolicy} />);
    const region = screen.getByRole("region", { name: "Tabla de tarifas de envío" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveClass("overflow-x-auto");
  });
});
