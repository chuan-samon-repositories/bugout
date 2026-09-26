import { describe, expect, it } from 'vitest';
import {
  PricingPolicy,
  calculateOrderTotals,
  findShippingRate,
  freeShippingThreshold,
  shippingCost,
} from './OrderPricing';
import { Cart } from '../cart/Cart';
import { buildProduct } from '../../testing/buildProduct';
import { testPricingPolicy } from '../../testing/testPricingPolicy';
import { Money } from '../../value-objects/Money';
import { Quantity } from '../../value-objects/Quantity';
import { NotFoundError } from '../../errors';

const eur = (major: number) => Money.fromMajor(major, 'EUR');

const policy = testPricingPolicy;

function cartWorth(major: number): Cart {
  const cart = new Cart('EUR');
  cart.addItem(buildProduct({ price: major }), new Quantity(1));
  return cart;
}

describe('OrderPricing', () => {
  it('charges standard shipping below the threshold and waives it at or above', () => {
    expect(calculateOrderTotals(cartWorth(74.99), 'standard', policy).shipping.minor).toBe(495);
    expect(calculateOrderTotals(cartWorth(75), 'standard', policy).shipping.minor).toBe(0);
    expect(calculateOrderTotals(cartWorth(199), 'standard', policy).shipping.minor).toBe(0);
  });

  it('never makes express or overnight shipping free', () => {
    expect(calculateOrderTotals(cartWorth(1000), 'express', policy).shipping.minor).toBe(995);
    expect(calculateOrderTotals(cartWorth(1000), 'overnight', policy).shipping.minor).toBe(1495);
  });

  it('extracts the tax included in the total', () => {
    const totals = calculateOrderTotals(cartWorth(49), 'standard', policy);
    expect(totals.subtotal.minor).toBe(4900);
    expect(totals.shipping.minor).toBe(495);
    expect(totals.total.minor).toBe(5395);
    // 53.95 / 1.21 = 44.586… → net 44.59, tax 9.36
    expect(totals.tax.minor).toBe(936);
  });

  it('adds tax on top when prices exclude it', () => {
    const totals = calculateOrderTotals(cartWorth(100), 'standard', { ...policy, pricesIncludeTax: false });
    expect(totals.shipping.minor).toBe(0);
    expect(totals.tax.minor).toBe(2100);
    expect(totals.total.minor).toBe(12100);
  });

  it('returns zero totals for an empty cart, charging shipping', () => {
    const totals = calculateOrderTotals(new Cart('EUR'), 'standard', policy);
    expect(totals.subtotal.minor).toBe(0);
    expect(totals.total.minor).toBe(495);
  });

  it('throws NotFoundError for an unknown shipping method', () => {
    expect(() => findShippingRate({ ...policy, shippingRates: [] }, 'standard')).toThrow(NotFoundError);
  });

  it('shippingCost compares against the subtotal', () => {
    const [standard] = policy.shippingRates;
    expect(shippingCost(standard, eur(10)).minor).toBe(495);
    expect(shippingCost(standard, eur(75)).isZero()).toBe(true);
  });

  it('freeShippingThreshold picks the lowest threshold', () => {
    expect(freeShippingThreshold(policy)?.minor).toBe(7500);
    const withCheaper: PricingPolicy = {
      ...policy,
      shippingRates: [
        ...policy.shippingRates,
        { id: 'express', price: eur(9.95), freeFrom: eur(50), deliveryDays: { min: 1, max: 2 } },
        { id: 'overnight', price: eur(14.95), freeFrom: eur(150), deliveryDays: { min: 1, max: 1 } },
      ],
    };
    expect(freeShippingThreshold(withCheaper)?.minor).toBe(5000);
  });

  it('freeShippingThreshold is null when no rate is ever free', () => {
    expect(freeShippingThreshold({ ...policy, shippingRates: policy.shippingRates.slice(1) })).toBeNull();
  });
});
