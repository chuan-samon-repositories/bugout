import { Cart } from '../../../domain/entities/cart/Cart';
import { CartRepository } from '../../../application/ports/CartRepository';
import { Product } from '../../../domain/entities/product/Product';
import { ProductId } from '../../../domain/value-objects/ProductId';
import { Money } from '../../../domain/value-objects/Money';
import { Quantity } from '../../../domain/value-objects/Quantity';
import { ShopifyConfig } from '../../config/ShopifyConfig';

// ---------------------------------------------------------------------------
// Shopify Storefront API types
// ---------------------------------------------------------------------------

interface ShopifyCartLine {
  quantity: number;
  merchandise: {
    id: string;
    price: { amount: string };
    compareAtPrice: { amount: string } | null;
    availableForSale: boolean;
    product: {
      title: string;
      description: string;
      productType: string;
      badge: { value: string } | null;
    };
  };
}

interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: { edges: Array<{ node: ShopifyCartLine }> };
}

// ---------------------------------------------------------------------------
// GraphQL operations
// ---------------------------------------------------------------------------

const CART_CREATE = `
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
        lines(first: 250) {
          edges {
            node {
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  price { amount }
                  compareAtPrice { amount }
                  availableForSale
                  product {
                    title description productType
                    badge: metafield(namespace: "custom", key: "badge") { value }
                  }
                }
              }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

const CART_QUERY = `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      lines(first: 250) {
        edges {
          node {
            quantity
            merchandise {
              ... on ProductVariant {
                id
                price { amount }
                compareAtPrice { amount }
                availableForSale
                product {
                  title description productType
                  badge: metafield(namespace: "custom", key: "badge") { value }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

// NOTE: save() always calls cartCreate to keep this skeleton simple.
// In production, use cartLinesAdd/cartLinesUpdate/cartLinesRemove with stored
// Shopify CartLine IDs to avoid creating a new cart on every mutation.

export class ShopifyCartAdapter implements CartRepository {
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

  async save(cart: Cart): Promise<void> {
    const lines = cart.getItems().map((item) => ({
      merchandiseId: item.product.id.value, // Shopify variant GID
      quantity: item.quantity.value,
    }));
    const { data } = await this.graphql<{ cartCreate: { cart: ShopifyCart } }>(
      CART_CREATE,
      { lines },
    );
    localStorage.setItem(this.cartIdKey, data.cartCreate.cart.id);
  }

  async load(): Promise<Cart> {
    const cartId = localStorage.getItem(this.cartIdKey);
    if (!cartId) return new Cart();
    const { data } = await this.graphql<{ cart: ShopifyCart | null }>(CART_QUERY, { cartId });
    if (!data.cart) {
      localStorage.removeItem(this.cartIdKey);
      return new Cart();
    }
    return this.mapToCart(data.cart);
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.cartIdKey);
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

  private mapToCart(shopifyCart: ShopifyCart): Cart {
    const cart = new Cart();
    for (const { node } of shopifyCart.lines.edges) {
      const { merchandise } = node;
      const product = new Product(
        new ProductId(merchandise.id),
        merchandise.product.title,
        new Money(parseFloat(merchandise.price.amount)),
        merchandise.compareAtPrice ? new Money(parseFloat(merchandise.compareAtPrice.amount)) : null,
        0,
        0,
        merchandise.product.description,
        merchandise.product.productType.toLowerCase().replace(/\s+/g, '-'),
        merchandise.availableForSale,
        merchandise.product.badge?.value ?? null,
      );
      cart.addItem(product, new Quantity(node.quantity));
    }
    return cart;
  }
}
