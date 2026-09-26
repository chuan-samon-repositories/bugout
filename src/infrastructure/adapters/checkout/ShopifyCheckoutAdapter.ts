import { CheckoutService } from '@/application/ports/CheckoutService';
import { Cart } from '@/domain/entities/cart/Cart';
import {
  CART_CHECKOUT_URL_QUERY,
  CART_CREATE_MUTATION,
  CartMutationPayload,
  toLineInputs,
} from '@/infrastructure/adapters/shopify/cartGraphql';
import { ShopifyCartIdStore } from '@/infrastructure/adapters/shopify/ShopifyCartIdStore';
import { ShopifyApiError, ShopifyClient, assertNoUserErrors } from '@/infrastructure/adapters/shopify/ShopifyClient';

/**
 * Hosted Shopify checkout for the visitor's Shopify cart. Uses the checkout URL the
 * cart adapter remembered for the stored cart id (checkout loads the cart first), and
 * only queries Shopify when none is known for that id.
 */
export class ShopifyCheckoutAdapter implements CheckoutService {
  constructor(
    private readonly client: ShopifyClient,
    private readonly cartIds: ShopifyCartIdStore,
  ) {}

  async getCheckoutUrl(cart: Cart): Promise<string> {
    const cartId = this.cartIds.get();
    if (cartId) {
      const known = this.cartIds.checkoutUrl();
      if (known) return known;
      const { cart: remote } = await this.client.request<{ cart: { checkoutUrl: string } | null }>(
        CART_CHECKOUT_URL_QUERY,
        { id: cartId },
        { noStore: true },
      );
      if (remote) {
        this.cartIds.rememberCheckoutUrl(cartId, remote.checkoutUrl);
        return remote.checkoutUrl;
      }
      this.cartIds.clear();
    }
    return this.createCart(cart);
  }

  private async createCart(cart: Cart): Promise<string> {
    const { cartCreate } = await this.client.request<{ cartCreate: CartMutationPayload }>(CART_CREATE_MUTATION, {
      lines: toLineInputs(cart),
    });
    assertNoUserErrors('cartCreate', cartCreate?.userErrors);
    if (!cartCreate?.cart) throw new ShopifyApiError('cartCreate returned no cart');
    this.cartIds.set(cartCreate.cart.id);
    this.cartIds.rememberCheckoutUrl(cartCreate.cart.id, cartCreate.cart.checkoutUrl);
    this.cartIds.markChanged();
    return cartCreate.cart.checkoutUrl;
  }
}
