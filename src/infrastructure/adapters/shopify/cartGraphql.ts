import { Cart } from '@/domain/entities/cart/Cart';
import {
  PRODUCT_FIELDS_FRAGMENT,
  ShopifyProductNode,
  ShopifyVariantNode,
  VARIANT_FIELDS_FRAGMENT,
} from '@/infrastructure/adapters/shopify/productMapping';
import { STOREFRONT_CONTEXT, ShopifyUserError } from '@/infrastructure/adapters/shopify/ShopifyClient';

const CART_FIELDS_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    lines(first: 250) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            ...VariantFields
            product { ...ProductFields }
          }
        }
      }
    }
  }
  ${VARIANT_FIELDS_FRAGMENT}
  ${PRODUCT_FIELDS_FRAGMENT}
`;

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: ShopifyVariantNode & { product: ShopifyProductNode };
}

export interface ShopifyCartNode {
  id: string;
  checkoutUrl: string;
  lines: { nodes: ShopifyCartLine[] };
}

/**
 * A change Shopify made to a mutation's input instead of failing it, e.g.
 * MERCHANDISE_NOT_ENOUGH_STOCK (quantity lowered to the stock) or
 * MERCHANDISE_OUT_OF_STOCK (line not added). `target` is the id of the line or cart concerned.
 */
export interface ShopifyCartWarning {
  code: string;
  message: string;
  target: string;
}

/** Warning codes whose effect (fewer units, or no line) the cart the mutation returns already shows. */
export const STOCK_WARNING_CODES: readonly string[] = ['MERCHANDISE_NOT_ENOUGH_STOCK', 'MERCHANDISE_OUT_OF_STOCK'];

export interface CartMutationPayload {
  cart: ShopifyCartNode | null;
  userErrors: ShopifyUserError[];
  warnings?: ShopifyCartWarning[];
}

const MUTATION_RESULT = 'cart { ...CartFields } userErrors { field message code } warnings { code message target }';

export const CART_QUERY = /* GraphQL */ `
  query Cart($id: ID!) ${STOREFRONT_CONTEXT} {
    cart(id: $id) { ...CartFields }
  }
  ${CART_FIELDS_FRAGMENT}
`;

export const CART_CHECKOUT_URL_QUERY = /* GraphQL */ `
  query CartCheckoutUrl($id: ID!) ${STOREFRONT_CONTEXT} {
    cart(id: $id) { checkoutUrl }
  }
`;

export const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]) ${STOREFRONT_CONTEXT} {
    cartCreate(input: { lines: $lines }) { ${MUTATION_RESULT} }
  }
  ${CART_FIELDS_FRAGMENT}
`;

export const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) ${STOREFRONT_CONTEXT} {
    cartLinesAdd(cartId: $cartId, lines: $lines) { ${MUTATION_RESULT} }
  }
  ${CART_FIELDS_FRAGMENT}
`;

export const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) ${STOREFRONT_CONTEXT} {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { ${MUTATION_RESULT} }
  }
  ${CART_FIELDS_FRAGMENT}
`;

export const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) ${STOREFRONT_CONTEXT} {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { ${MUTATION_RESULT} }
  }
  ${CART_FIELDS_FRAGMENT}
`;

/** `CartLineInput`s for every item in the aggregate (merchandise id = variant GID). */
export function toLineInputs(cart: Cart): Array<{ merchandiseId: string; quantity: number }> {
  return cart.getItems().map((item) => ({ merchandiseId: item.product.id.value, quantity: item.quantity.value }));
}
