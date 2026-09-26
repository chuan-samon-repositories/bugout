import { freeShippingThreshold, type PricingPolicy, type ShippingRate } from "@/domain/entities/order/OrderPricing";
import type { Money } from "@/domain/value-objects/Money";

export interface DeliveryFacts {
  /** The standard (cheapest) rate, or null when the policy has none. */
  standard: ShippingRate | null;
  freeFrom: Money | null;
}

/** Shipping facts quoted on the home and product pages, taken from the pricing policy. */
export function deliveryFacts(policy: PricingPolicy): DeliveryFacts {
  const standard =
    policy.shippingRates.find((rate) => rate.id === "standard") ??
    [...policy.shippingRates].sort((a, b) => a.price.minor - b.price.minor)[0] ??
    null;
  return { standard, freeFrom: freeShippingThreshold(policy) };
}
