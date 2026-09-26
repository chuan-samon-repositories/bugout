import { OrderTotals, ShippingMethodId } from '@/domain/entities/order/OrderPricing';

export interface CustomerDetails {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface ShippingAddress {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

/** Everything the in-app checkout collects. No payment data: the local checkout is a demo. */
export interface CheckoutDetails {
  customer: CustomerDetails;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethodId;
  notes: string;
  marketingOptIn: boolean;
}

export interface OrderLine {
  productId: string;
  name: string;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
}

export interface OrderRequest {
  details: CheckoutDetails;
  lines: OrderLine[];
  totals: OrderTotals;
}

/** Immutable snapshot of a placed order, shown on the confirmation screen. */
export interface OrderConfirmation {
  orderNumber: string;
  placedAt: string;
  email: string;
  lines: OrderLine[];
  totals: OrderTotals;
  shippingMethod: ShippingMethodId;
}
