import type { OrderConfirmation, OrderLine } from "@/application/dtos/Order";
import type { OrderTotals, ShippingMethodId } from "@/domain/entities/order/OrderPricing";
import { Money } from "@/domain/value-objects/Money";

export const LAST_ORDER_STORAGE_KEY = "bugout.lastOrder";

type TotalsKey = keyof OrderTotals;
const TOTALS_KEYS: readonly TotalsKey[] = ["subtotal", "shipping", "tax", "total"];
const SHIPPING_METHODS: readonly ShippingMethodId[] = ["standard", "express", "overnight"];

interface StoredMoney {
  minor: number;
  currency: string;
}

interface StoredOrder extends Omit<OrderConfirmation, "totals"> {
  totals: Record<TotalsKey, StoredMoney>;
}

function toStored(confirmation: OrderConfirmation): StoredOrder {
  const totals = Object.fromEntries(
    TOTALS_KEYS.map((key) => [key, { minor: confirmation.totals[key].minor, currency: confirmation.totals[key].currency }]),
  ) as Record<TotalsKey, StoredMoney>;
  return { ...confirmation, lines: confirmation.lines.map((line) => ({ ...line })), totals };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLine(value: unknown): value is OrderLine {
  return (
    isRecord(value) &&
    typeof value.productId === "string" &&
    typeof value.name === "string" &&
    typeof value.quantity === "number" &&
    typeof value.unitPriceMinor === "number" &&
    typeof value.subtotalMinor === "number"
  );
}

function toMoney(value: unknown): Money {
  if (!isRecord(value) || typeof value.minor !== "number" || typeof value.currency !== "string") {
    throw new Error("Invalid stored money");
  }
  return Money.fromMinor(value.minor, value.currency);
}

/** Rebuilds a confirmation from its JSON form; null when the value is not a valid stored order. */
export function parseStoredOrder(raw: string | null): OrderConfirmation | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      typeof value.orderNumber !== "string" ||
      typeof value.placedAt !== "string" ||
      typeof value.email !== "string" ||
      !Array.isArray(value.lines) ||
      !value.lines.every(isLine) ||
      !SHIPPING_METHODS.includes(value.shippingMethod as ShippingMethodId) ||
      !isRecord(value.totals)
    ) {
      return null;
    }
    const storedTotals = value.totals;
    const [subtotal, shipping, tax, total] = TOTALS_KEYS.map((key) => toMoney(storedTotals[key]));
    return {
      orderNumber: value.orderNumber,
      placedAt: value.placedAt,
      email: value.email,
      lines: value.lines,
      shippingMethod: value.shippingMethod as ShippingMethodId,
      totals: { subtotal, shipping, tax, total },
    };
  } catch {
    return null;
  }
}

export function serializeOrder(confirmation: OrderConfirmation): string {
  return JSON.stringify(toStored(confirmation));
}

export function saveLastOrder(confirmation: OrderConfirmation): void {
  try {
    window.sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, serializeOrder(confirmation));
  } catch {
    // Storage may be unavailable (private mode, quota); the confirmation still renders from state.
  }
}

export function readLastOrder(): OrderConfirmation | null {
  try {
    return parseStoredOrder(window.sessionStorage.getItem(LAST_ORDER_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearLastOrder(): void {
  try {
    window.sessionStorage.removeItem(LAST_ORDER_STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
