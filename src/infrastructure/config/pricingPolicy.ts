import { PricingPolicy } from '@/domain/entities/order/OrderPricing';
import { Money } from '@/domain/value-objects/Money';

const STORE_CURRENCY = 'EUR';
const eur = (amount: number) => Money.fromMajor(amount, STORE_CURRENCY);

/** Bugout's shipping and tax rules: prices include 21% IVA; standard shipping is free from 75 €. */
export const storePricingPolicy: PricingPolicy = {
  currency: STORE_CURRENCY,
  taxRate: 0.21,
  pricesIncludeTax: true,
  shippingRates: [
    { id: 'standard', price: eur(4.95), freeFrom: eur(75), deliveryDays: { min: 3, max: 5 } },
    { id: 'express', price: eur(9.95), freeFrom: null, deliveryDays: { min: 1, max: 2 } },
    { id: 'overnight', price: eur(14.95), freeFrom: null, deliveryDays: { min: 1, max: 1 } },
  ],
};
