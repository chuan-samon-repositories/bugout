import { vi } from 'vitest';
import { ShopifyClient, FetchLike } from '@/infrastructure/adapters/shopify/ShopifyClient';
import { ShopifyProductNode, ShopifyProductWithVariants, ShopifyVariantNode } from '@/infrastructure/adapters/shopify/productMapping';
import { ShopifyCartNode, ShopifyCartWarning } from '@/infrastructure/adapters/shopify/cartGraphql';

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
    title: 'Default Title',
    availableForSale: true,
    selectedOptions: [{ name: 'Title', value: 'Default Title' }],
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
    seo: { title: null, description: null },
    productType: 'Survival Kits',
    tags: [],
    images: { nodes: [] },
    badge: null,
    rating: null,
    ratingCount: null,
    features: null,
    specifications: null,
    contents: null,
    kit: null,
    related: null,
    longDescription: null,
    position: null,
    ...overrides,
  };
}

/**
 * A variant for a "Personas" option as Shopify returns it, e.g. `peopleVariant(2, 2, '199.0')`:
 * option value "2" and a `title` built from it, "2" (the site shows it as "2 personas").
 */
export function peopleVariant(n: number, people: number, amount: string, overrides: Partial<ShopifyVariantNode> = {}) {
  return variantNode(n, {
    title: String(people),
    selectedOptions: [{ name: 'Personas', value: String(people) }],
    price: { amount, currencyCode: 'EUR' },
    ...overrides,
  });
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
  /** Merchandise variant; defaults to a single "Default Title" variant. */
  merchandise?: ShopifyVariantNode;
  /** The variant's product; defaults to "Producto <variant>" with handle `producto-<variant>`. */
  product?: ShopifyProductNode;
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
          ...(line.merchandise ?? variantNode(line.variant)),
          availableForSale: line.available ?? true,
          product: line.product ?? productNode({ handle: `producto-${line.variant}`, title: `Producto ${line.variant}` }),
        },
      })),
    },
  };
}

export function mutationResult(
  operation: string,
  cart: ShopifyCartNode | null,
  userErrors: unknown[] = [],
  warnings: ShopifyCartWarning[] = [],
) {
  return { data: { [operation]: { cart, userErrors, warnings } } };
}
