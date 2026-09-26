import { CheckoutSession, CommerceProvider } from '../dtos/Checkout';
import { CartRepository } from '../ports/CartRepository';
import { CheckoutService } from '../ports/CheckoutService';

const ABSOLUTE_HTTP_URL = /^https?:\/\//i;

export class CreateCheckoutUseCase {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly checkoutService: CheckoutService,
    private readonly provider: CommerceProvider,
  ) {}

  async execute(): Promise<CheckoutSession> {
    const cart = await this.cartRepository.load();
    const url = await this.checkoutService.getCheckoutUrl(cart);
    const type = ABSOLUTE_HTTP_URL.test(url) ? 'hosted' : 'local';
    if (this.provider === 'shopify' && type !== 'hosted') {
      throw new Error(`Shopify checkout returned a non-absolute URL: ${url}`);
    }
    return { url, type };
  }
}
