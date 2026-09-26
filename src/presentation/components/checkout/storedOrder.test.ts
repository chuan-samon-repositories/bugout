import { describe, expect, it } from "vitest";
import type { OrderConfirmation } from "@/application/dtos/Order";
import { Money } from "@/domain/value-objects/Money";
import { parseStoredOrder, serializeOrder } from "./storedOrder";

const eur = (minor: number) => Money.fromMinor(minor, "EUR");

const confirmation: OrderConfirmation = {
  orderNumber: "BUG-7K2Q9XA1",
  placedAt: "2026-09-26T10:00:00.000Z",
  email: "ana@example.es",
  lines: [{ productId: "kit", name: "Kit 24H", quantity: 2, unitPriceMinor: 3900, subtotalMinor: 7800 }],
  totals: { subtotal: eur(7800), shipping: eur(0), tax: eur(1354), total: eur(7800) },
  shippingMethod: "standard",
};

describe("stored order", () => {
  it("round-trips a confirmation through its JSON form with Money rebuilt from minor units", () => {
    const restored = parseStoredOrder(serializeOrder(confirmation));
    expect(restored).toEqual(confirmation);
    expect(restored?.totals.total).toBeInstanceOf(Money);
    expect(restored?.totals.tax.equals(eur(1354))).toBe(true);
  });

  it("rejects missing, malformed or tampered values", () => {
    expect(parseStoredOrder(null)).toBeNull();
    expect(parseStoredOrder("not json")).toBeNull();
    expect(parseStoredOrder("{}")).toBeNull();
    const stored = JSON.parse(serializeOrder(confirmation));
    expect(parseStoredOrder(JSON.stringify({ ...stored, shippingMethod: "teleport" }))).toBeNull();
    expect(parseStoredOrder(JSON.stringify({ ...stored, totals: { ...stored.totals, total: { minor: -1, currency: "EUR" } } }))).toBeNull();
  });
});
