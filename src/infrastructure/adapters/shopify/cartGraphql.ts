import { Cart } from '@/domain/entities/cart/Cart';
import {
  PRODUCT_FIELDS_FRAGMENT,
  ShopifyProductNode,
  ShopifyVariantNode,
  VARIANT_FIELDS_FRAGMENT,
} from './productMapping';
import { ShopifyUserError } from './ShopifyClient';

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

export interface CartMutationPayload {
  cart: ShopifyCartNode | null;
  userErrors: ShopifyUserError[];
}

const MUTATION_RESULT = 'cart { ...CartFields } userErrors { field message code }';

export const CART_QUERY = /* GraphQL */ `
  query Cart($id: ID!) {
    cart(id: $id) { ...CartFields }
  }
  ${CART_FIELDS_FRAGMENT}
`;

export const CART_CHECKOUT_URL_QUERY = /* GraphQL */ `
  query CartCheckoutUrl($id: ID!) {
    cart(id: $id) { checkoutUrl }
  }
`;

export const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) { ${MUTATION_RESULT} }
  }
  ${CART_FIELDS_FRAGMENT}
`;

export const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) { ${MUTATION_RESULT} }
  }
  ${CART_FIELDS_FRAGMENT}
`;

export const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { ${MUTATION_RESULT} }
  }
  ${CART_FIELDS_FRAGMENT}
`;

export const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { ${MUTATION_RESULT} }
  }
  ${CART_FIELDS_FRAGMENT}
`;

/** `CartLineInput`s for every item in the aggregate (merchandise id = variant GID). */
export function toLineInputs(cart: Cart): Array<{ merchandiseId: string; quantity: number }> {
  return cart.getItems().map((item) => ({ merchandiseId: item.product.id.value, quantity: item.quantity.value }));
}
