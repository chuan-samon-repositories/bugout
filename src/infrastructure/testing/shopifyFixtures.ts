import { vi } from 'vitest';
import { ShopifyClient, FetchLike } from '../adapters/shopify/ShopifyClient';
import { ShopifyProductNode, ShopifyProductWithVariants, ShopifyVariantNode } from '../adapters/shopify/productMapping';
import { ShopifyCartNode } from '../adapters/shopify/cartGraphql';

export const variantGid = (n: number) => `gid://shopify/ProductVariant/${n}`;

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** fetch mock answering each call with the next queued body (or Response). */
export function queuedFetch(...bodies: unknown[]) {
  const fetch = vi.fn<FetchLike>();
  bodies.forEach((body) => fetch.mockResolvedValueOnce(body instanceof Response ? body : jsonResponse(body)));
  return fetch;
}

export function sentRequest(fetch: ReturnType<typeof queuedFetch>, call: number) {
  const [url, init] = fetch.mock.calls[call];
  const body = JSON.parse(String(init.body)) as { query: string; variables: Record<string, unknown> };
  return { url, init, ...body };
}

export function testClient(fetch: FetchLike): ShopifyClient {
  return new ShopifyClient({ storeDomain: 'bugout-test.myshopify.com', storefrontAccessToken: 'public-token' }, fetch);
}

export function variantNode(n: number, overrides: Partial<ShopifyVariantNode> = {}): ShopifyVariantNode {
  return {
    id: variantGid(n),
    availableForSale: true,
    price: { amount: '199.0', currencyCode: 'EUR' },
    compareAtPrice: null,
    ...overrides,
  };
}

export function productNode(overrides: Partial<ShopifyProductNode> = {}): ShopifyProductNode {
  return {
    handle: 'mochila-24h',
    title: 'Mochila 24H',
    description: 'Kit para 24 horas',
    productType: 'Survival Kits',
    tags: [],
    images: { nodes: [] },
    badge: null,
    rating: null,
    ratingCount: null,
    features: null,
    specifications: null,
    contents: null,
    ...overrides,
  };
}

export function productWithVariants(
  overrides: Partial<ShopifyProductNode> = {},
  variants: ShopifyVariantNode[] = [variantNode(1)],
): ShopifyProductWithVariants {
  return { ...productNode(overrides), variants: { nodes: variants } };
}

export interface LineSpec {
  lineId: string;
  variant: number;
  quantity: number;
  available?: boolean;
}

export function cartNode(id: string, lines: LineSpec[] = []): ShopifyCartNode {
  return {
    id,
    checkoutUrl: `https://bugout-test.myshopify.com/cart/c/${encodeURIComponent(id)}`,
    lines: {
      nodes: lines.map((line) => ({
        id: line.lineId,
        quantity: line.quantity,
        merchandise: {
          ...variantNode(line.variant, { availableForSale: line.available ?? true }),
          product: productNode({ handle: `producto-${line.variant}`, title: `Producto ${line.variant}` }),
        },
      })),
    },
  };
}

export function mutationResult(operation: string, cart: ShopifyCartNode | null, userErrors: unknown[] = []) {
  return { data: { [operation]: { cart, userErrors } } };
}
