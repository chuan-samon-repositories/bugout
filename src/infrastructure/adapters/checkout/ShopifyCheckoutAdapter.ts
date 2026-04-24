import { Cart } from '../../../domain/entities/cart/Cart';
import { CheckoutService } from '../../../application/ports/CheckoutService';
import { ShopifyConfig } from '../../config/ShopifyConfig';

const CART_CREATE = `
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

const CART_CHECKOUT_URL = `
  query GetCartCheckoutUrl($cartId: ID!) {
    cart(id: $cartId) { checkoutUrl }
  }
`;

export class ShopifyCheckoutAdapter implements CheckoutService {
  private readonly endpoint: string;
  private readonly headers: HeadersInit;
  private readonly cartIdKey = 'shopify-cart-id';

  constructor(config: ShopifyConfig) {
    const version = config.apiVersion ?? '2024-01';
    this.endpoint = `https://${config.storeDomain}/api/${version}/graphql.json`;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
    };
  }

  async getCheckoutUrl(cart: Cart): Promise<string> {
    const cartId = localStorage.getItem(this.cartIdKey);
    if (cartId) {
      return this.fetchCheckoutUrl(cartId);
    }
    return this.createCartAndGetUrl(cart);
  }

  private async fetchCheckoutUrl(cartId: string): Promise<string> {
    const { data } = await this.graphql<{ cart: { checkoutUrl: string } | null }>(
      CART_CHECKOUT_URL,
      { cartId },
    );
    if (!data.cart) throw new Error('Shopify cart expired — please add items again');
    return data.cart.checkoutUrl;
  }

  private async createCartAndGetUrl(cart: Cart): Promise<string> {
    const lines = cart.getItems().map((item) => ({
      merchandiseId: item.product.id.value,
      quantity: item.quantity.value,
    }));
    const { data } = await this.graphql<{
      cartCreate: { cart: { id: string; checkoutUrl: string } };
    }>(CART_CREATE, { lines });
    localStorage.setItem(this.cartIdKey, data.cartCreate.cart.id);
    return data.cartCreate.cart.checkoutUrl;
  }

  private async graphql<T>(query: string, variables: Record<string, unknown>): Promise<{ data: T }> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) throw new Error(`Shopify API error: ${response.status}`);
    return response.json();
  }
}
