import { CheckoutContext } from '@/application/dtos/Checkout';
import { CheckoutService } from '@/application/ports/CheckoutService';
import { Cart } from '@/domain/entities/cart/Cart';
import {
  CheckoutCartPayload,
  cartAttributesUpdateMutation,
  checkoutCartCreateMutation,
  toLineInputs,
} from '@/infrastructure/adapters/shopify/cartGraphql';
import { CartAttribute, toCartAttributes } from '@/infrastructure/adapters/shopify/checkoutAttributes';
import { ShopifyCartIdStore } from '@/infrastructure/adapters/shopify/ShopifyCartIdStore';
import { ShopifyApiError, ShopifyClient, assertNoUserErrors } from '@/infrastructure/adapters/shopify/ShopifyClient';

/**
 * Hosted Shopify checkout for the visitor's Shopify cart. Right before the hand-off it writes the visit's
 * analytics attribution onto the cart as attributes (replacing earlier ones, so a withdrawn consent clears them)
 * and asks for the checkout URL in the visitor's consent context, so Shopify's checkout, its pixels and the order
 * follow the site's cookie decision. Creates the cart from the aggregate when there is none or it expired.
 */
export class ShopifyCheckoutAdapter implements CheckoutService {
  constructor(
    private readonly client: ShopifyClient,
    private readonly cartIds: ShopifyCartIdStore,
  ) {}

  async getCheckoutUrl(cart: Cart, context: CheckoutContext): Promise<string> {
    const attributes = toCartAttributes(context.attribution);
    const cartId = this.cartIds.get();
    if (cartId) {
      const { cartAttributesUpdate: payload } = await this.client.request<{ cartAttributesUpdate: CheckoutCartPayload }>(
        cartAttributesUpdateMutation(context.analyticsConsent),
        { cartId, attributes },
      );
      // No cart back means it expired or was already checked out: start a new one.
      if (payload?.cart) {
        assertNoUserErrors('cartAttributesUpdate', payload.userErrors);
        return payload.cart.checkoutUrl;
      }
      this.cartIds.clear();
    }
    return this.createCart(cart, context, attributes);
  }

  private async createCart(cart: Cart, context: CheckoutContext, attributes: CartAttribute[]): Promise<string> {
    const { cartCreate } = await this.client.request<{ cartCreate: CheckoutCartPayload }>(
      checkoutCartCreateMutation(context.analyticsConsent),
      { lines: toLineInputs(cart), attributes },
    );
    assertNoUserErrors('cartCreate', cartCreate?.userErrors);
    if (!cartCreate?.cart) throw new ShopifyApiError('cartCreate returned no cart');
    this.cartIds.set(cartCreate.cart.id);
    this.cartIds.markChanged();
    return cartCreate.cart.checkoutUrl;
  }
}
