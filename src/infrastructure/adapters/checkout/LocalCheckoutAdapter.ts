import { CheckoutService } from '@/application/ports/CheckoutService';

export const LOCAL_CHECKOUT_PATH = '/checkout';

/** In-app demo checkout (no payment). */
export class LocalCheckoutAdapter implements CheckoutService {
  async getCheckoutUrl(): Promise<string> {
    return LOCAL_CHECKOUT_PATH;
  }
}
