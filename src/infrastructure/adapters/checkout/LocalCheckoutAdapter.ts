import { Cart } from '../../../domain/entities/cart/Cart';
import { CheckoutService } from '../../../application/ports/CheckoutService';

export class LocalCheckoutAdapter implements CheckoutService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getCheckoutUrl(_cart: Cart): Promise<string> {
    return '/checkout';
  }
}
