import { describe, expect, it } from 'vitest';
import { storePricingPolicy } from './pricingPolicy';
import { freeShippingThreshold } from '@/domain/entities/order/OrderPricing';

describe('storePricingPolicy', () => {
  it('prices in EUR with 21% IVA included', () => {
    expect(storePricingPolicy.currency).toBe('EUR');
    expect(storePricingPolicy.taxRate).toBe(0.21);
    expect(storePricingPolicy.pricesIncludeTax).toBe(true);
  });

  it('defines the three shipping rates', () => {
    const summary = storePricingPolicy.shippingRates.map((rate) => ({
      id: rate.id,
      price: rate.price.minor,
      freeFrom: rate.freeFrom?.minor ?? null,
      days: rate.deliveryDays,
    }));
    expect(summary).toEqual([
      { id: 'standard', price: 495, freeFrom: 7500, days: { min: 3, max: 5 } },
      { id: 'express', price: 995, freeFrom: null, days: { min: 1, max: 2 } },
      { id: 'overnight', price: 1495, freeFrom: null, days: { min: 1, max: 1 } },
    ]);
    expect(freeShippingThreshold(storePricingPolicy)?.minor).toBe(7500);
  });
});
