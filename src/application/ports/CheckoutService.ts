import { CheckoutContext } from '@/application/dtos/Checkout';
import { Cart } from '@/domain/entities/cart/Cart';

/**
 * Starts checkout for a cart. Returns either an in-app route (local demo
 * checkout, e.g. "/checkout") or an absolute URL to a hosted checkout (Shopify).
 * A hosted checkout carries `context` along: the visitor's consent, and the
 * attribution that links the order back to their visit.
 */
export interface CheckoutService {
  getCheckoutUrl(cart: Cart, context: CheckoutContext): Promise<string>;
}
