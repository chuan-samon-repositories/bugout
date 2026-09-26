import { shippingCost, type PricingPolicy, type ShippingRate } from "@/domain/entities/order/OrderPricing";
import type { Money } from "@/domain/value-objects/Money";
import { formatMoney, formatNumber, messages } from "@/presentation/i18n";

const copy = messages.checkout;

export function shippingMethodLabel(rate: Pick<ShippingRate, "id">): string {
  return copy.shippingMethods[rate.id];
}

export function deliveryEstimate(rate: Pick<ShippingRate, "deliveryDays">): string {
  return copy.deliveryEstimate(rate.deliveryDays.min, rate.deliveryDays.max);
}

/** "Gratis" for zero, otherwise the formatted amount. */
export function formatShippingPrice(price: Money): string {
  return price.isZero() ? copy.free : formatMoney(price);
}

/** The price this rate actually costs for an order with this subtotal. */
export function chargedShippingPrice(rate: ShippingRate, subtotal: Money): string {
  return formatShippingPrice(shippingCost(rate, subtotal));
}

/** Tax rate as a display percentage, e.g. "21". */
export function formatTaxRate(policy: PricingPolicy): string {
  return formatNumber(Math.round(policy.taxRate * 10000) / 100);
}

export function taxLabel(policy: PricingPolicy): string {
  const rate = formatTaxRate(policy);
  return policy.pricesIncludeTax ? copy.summary.taxIncluded(rate) : copy.summary.tax(rate);
}
