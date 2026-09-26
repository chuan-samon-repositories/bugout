import { ValidationError } from '@/domain/errors';
import { CheckoutSession, CommerceProvider } from '../dtos/Checkout';
import { CartRepository } from '../ports/CartRepository';
import { CheckoutService } from '../ports/CheckoutService';

/** An absolute https:// URL with a host (hosted checkout). */
function isHostedUrl(url: string): boolean {
  if (!/^https:\/\//i.test(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname !== '';
  } catch {
    return false;
  }
}

/** An in-app path: a single leading "/" (not "//host" or "/\host", which browsers treat as another origin). */
function isLocalPath(url: string): boolean {
  return /^\/(?![/\\])/.test(url) && !/[\s\\]/.test(url);
}

/**
 * Starts checkout for the current cart.
 * @throws ValidationError when the cart is empty
 * @throws Error when the checkout service returns anything other than an https:// URL
 *   (hosted) or an in-app path (local), or a non-hosted URL for the Shopify provider
 */
export class CreateCheckoutUseCase {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly checkoutService: CheckoutService,
    private readonly provider: CommerceProvider,
  ) {}

  async execute(): Promise<CheckoutSession> {
    const cart = await this.cartRepository.load();
    if (cart.isEmpty()) throw new ValidationError('Cart is empty');
    const url = (await this.checkoutService.getCheckoutUrl(cart)).trim();
    if (isHostedUrl(url)) return { url, type: 'hosted' };
    if (this.provider === 'shopify') {
      throw new Error(`Shopify checkout returned a URL that is not an absolute https:// URL: ${url}`);
    }
    if (isLocalPath(url)) return { url, type: 'local' };
    throw new Error(`Checkout returned an unsafe URL: ${url}`);
  }
}
