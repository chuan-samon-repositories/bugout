import { CheckoutService } from '@/application/ports/CheckoutService';
import { Cart } from '@/domain/entities/cart/Cart';
import {
  CART_CHECKOUT_URL_QUERY,
  CART_CREATE_MUTATION,
  CartMutationPayload,
  toLineInputs,
} from '../shopify/cartGraphql';
import { ShopifyCartIdStore } from '../shopify/ShopifyCartIdStore';
import { ShopifyApiError, ShopifyClient, assertNoUserErrors } from '../shopify/ShopifyClient';

/** Hosted Shopify checkout for the visitor's Shopify cart. */
export class ShopifyCheckoutAdapter implements CheckoutService {
  constructor(
    private readonly client: ShopifyClient,
    private readonly cartIds: ShopifyCartIdStore,
  ) {}

  async getCheckoutUrl(cart: Cart): Promise<string> {
    const cartId = this.cartIds.get();
    if (cartId) {
      const { cart: remote } = await this.client.request<{ cart: { checkoutUrl: string } | null }>(
        CART_CHECKOUT_URL_QUERY,
        { id: cartId },
        { noStore: true },
      );
      if (remote) return remote.checkoutUrl;
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
    return cartCreate.cart.checkoutUrl;
  }
}
