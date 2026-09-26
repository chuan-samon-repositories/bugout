import { NotFoundError } from '../../errors';
import { CurrencyCode, Money } from '../../value-objects/Money';
import { Cart } from '../cart/Cart';

export type ShippingMethodId = 'standard' | 'express' | 'overnight';

export interface ShippingRate {
  id: ShippingMethodId;
  price: Money;
  /** Order subtotal at or above which this rate is free; null when never free. */
  freeFrom: Money | null;
  /** Delivery estimate in business days. */
  deliveryDays: { min: number; max: number };
}

/**
 * Store-wide pricing rules. The single source for shipping and tax so every
 * screen (product page, cart, checkout) quotes the same numbers.
 */
export interface PricingPolicy {
  currency: CurrencyCode;
  shippingRates: readonly ShippingRate[];
  /** Tax rate as a fraction, e.g. 0.21 for 21% IVA. */
  taxRate: number;
  /** When true, catalog prices already include tax (EU-style). */
  pricesIncludeTax: boolean;
}

export interface OrderTotals {
  subtotal: Money;
  shipping: Money;
  /** Tax portion of the total (already contained in it when prices include tax). */
  tax: Money;
  total: Money;
}

export function findShippingRate(policy: PricingPolicy, id: ShippingMethodId): ShippingRate {
  const rate = policy.shippingRates.find((candidate) => candidate.id === id);
  if (!rate) {
    throw new NotFoundError(`Unknown shipping method: ${id}`);
  }
  return rate;
}

export function shippingCost(rate: ShippingRate, subtotal: Money): Money {
  if (rate.freeFrom && subtotal.greaterThanOrEqual(rate.freeFrom)) {
    return Money.zero(subtotal.currency);
  }
  return rate.price;
}

/** Lowest free-shipping threshold across all rates, for "free shipping from X" messaging. */
export function freeShippingThreshold(policy: PricingPolicy): Money | null {
  return policy.shippingRates
    .map((rate) => rate.freeFrom)
    .filter((threshold): threshold is Money => threshold !== null)
    .reduce<Money | null>((lowest, threshold) => (!lowest || lowest.greaterThan(threshold) ? threshold : lowest), null);
}

export function calculateOrderTotals(
  cart: Cart,
  shippingMethodId: ShippingMethodId,
  policy: PricingPolicy,
): OrderTotals {
  const subtotal = cart.totalAmount();
  const shipping = shippingCost(findShippingRate(policy, shippingMethodId), subtotal);
  const taxable = subtotal.add(shipping);

  if (policy.pricesIncludeTax) {
    const net = taxable.multiply(1 / (1 + policy.taxRate));
    return { subtotal, shipping, tax: taxable.subtract(net), total: taxable };
  }

  const tax = taxable.multiply(policy.taxRate);
  return { subtotal, shipping, tax, total: taxable.add(tax) };
}
