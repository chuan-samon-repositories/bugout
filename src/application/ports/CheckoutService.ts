import { Cart } from '../../domain/entities/cart/Cart';

export interface CheckoutService {
  getCheckoutUrl(cart: Cart): Promise<string>;
}
