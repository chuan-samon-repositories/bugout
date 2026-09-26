import { Cart } from '../../domain/entities/cart/Cart';

/**
 * Starts checkout for a cart. Returns either an in-app route (local demo
 * checkout, e.g. "/checkout") or an absolute URL to a hosted checkout (Shopify).
 */
export interface CheckoutService {
  getCheckoutUrl(cart: Cart): Promise<string>;
}
