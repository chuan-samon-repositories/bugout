import { CheckoutDetails } from '@/application/dtos/Order';

/** Test helper: a complete, valid set of checkout details. */
export function buildCheckoutDetails(overrides: {
  customer?: Partial<CheckoutDetails['customer']>;
  shippingAddress?: Partial<CheckoutDetails['shippingAddress']>;
  shippingMethod?: CheckoutDetails['shippingMethod'];
} = {}): CheckoutDetails {
  return {
    customer: {
      email: 'ana@example.es',
      firstName: 'Ana',
      lastName: 'García',
      phone: '612 345 678',
      ...overrides.customer,
    },
    shippingAddress: {
      address: 'Calle Mayor 1, 2º B',
      city: 'Madrid',
      province: 'Madrid',
      postalCode: '28013',
      country: 'ES',
      ...overrides.shippingAddress,
    },
    shippingMethod: overrides.shippingMethod ?? 'standard',
    notes: '',
    marketingOptIn: false,
  };
}
