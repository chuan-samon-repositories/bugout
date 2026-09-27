import { ProductRepository } from '@/application/ports/ProductRepository';
import { Product } from '@/domain/entities/product/Product';
import { NotFoundError } from '@/domain/errors';
import { CurrencyCode } from '@/domain/value-objects/Money';
import { ProductId } from '@/domain/value-objects/ProductId';
import {
  PRODUCT_FIELDS_FRAGMENT,
  ShopifyProductNode,
  ShopifyProductWithVariants,
  ShopifyVariantNode,
  VARIANT_FIELDS_FRAGMENT,
  mapShopifyProduct,
  parsePosition,
} from '@/infrastructure/adapters/shopify/productMapping';
import { STOREFRONT_CONTEXT, ShopifyClient } from '@/infrastructure/adapters/shopify/ShopifyClient';

const PAGE_SIZE = 100;
/** Enough for every kit size; Shopify allows up to 100 variants per product. */
const VARIANTS_PER_PRODUCT = 20;
const VARIANT_GID_PREFIX = 'gid://shopify/ProductVariant/';

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $after: String) ${STOREFRONT_CONTEXT} {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ...ProductFields
        variants(first: ${VARIANTS_PER_PRODUCT}) { nodes { ...VariantFields } }
      }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
  ${VARIANT_FIELDS_FRAGMENT}
`;

const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query ProductByHandle($handle: String!) ${STOREFRONT_CONTEXT} {
    product(handle: $handle) {
      ...ProductFields
      variants(first: ${VARIANTS_PER_PRODUCT}) { nodes { ...VariantFields } }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
  ${VARIANT_FIELDS_FRAGMENT}
`;

const VARIANT_BY_ID_QUERY = /* GraphQL */ `
  query VariantById($id: ID!) ${STOREFRONT_CONTEXT} {
    node(id: $id) {
      ... on ProductVariant {
        ...VariantFields
        product {
          ...ProductFields
          variants(first: ${VARIANTS_PER_PRODUCT}) { nodes { ...VariantFields } }
        }
      }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
  ${VARIANT_FIELDS_FRAGMENT}
`;

interface ProductsPage {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: ShopifyProductWithVariants[];
  };
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** The first price or compare-at price not in `currency`, or null when all are. */
function foreignCurrency(variants: readonly ShopifyVariantNode[], currency: CurrencyCode): string | null {
  for (const { price, compareAtPrice } of variants) {
    if (price.currencyCode !== currency) return price.currencyCode;
    if (compareAtPrice && compareAtPrice.currencyCode !== currency) return compareAtPrice.currencyCode;
  }
  return null;
}

/**
 * Maps a product and variant, or returns null (with a warning naming the handle and
 * the reason) when Shopify data breaks a domain rule, e.g. a zero price or an invalid
 * handle, or is priced in a currency other than the store's. One bad product then hides
 * only itself instead of the whole catalog.
 */
function mapOrSkip(
  node: ShopifyProductNode,
  variant: ShopifyVariantNode | undefined,
  variants: readonly ShopifyVariantNode[] | undefined,
  currency: CurrencyCode,
): Product | null {
  if (!variant) {
    console.warn(`[shopify] Skipping product "${node.handle}": it has no variants`);
    return null;
  }
  const foreign = foreignCurrency([variant, ...(variants ?? [])], currency);
  if (foreign) {
    console.warn(
      `[shopify] Skipping product "${node.handle}": it is priced in ${foreign}, not the store currency ${currency}. ` +
        `Check that the Shopify market for Spain (ES) sells in ${currency}.`,
    );
    return null;
  }
  try {
    return mapShopifyProduct(node, variant, variants);
  } catch (error) {
    console.warn(`[shopify] Skipping product "${node.handle}": ${reasonOf(error)}`);
    return null;
  }
}

/** Maps a product with all its variants, selecting the first one for sale (else the first); see mapOrSkip. */
function mapWithDefaultVariant(node: ShopifyProductWithVariants, currency: CurrencyCode): Product | null {
  const variants = node.variants.nodes;
  return mapOrSkip(node, variants.find((variant) => variant.availableForSale) ?? variants[0], variants, currency);
}

/**
 * Catalog order: products with a `custom.position` metafield first, lowest position
 * first; then the rest. Ties keep Shopify's order (the sort is stable).
 */
export function sortByPosition<T extends Pick<ShopifyProductNode, 'position'>>(nodes: readonly T[]): T[] {
  const rank = (node: T) => parsePosition(node) ?? Number.POSITIVE_INFINITY;
  return [...nodes].sort((a, b) => {
    const left = rank(a);
    const right = rank(b);
    return left === right ? 0 : left < right ? -1 : 1;
  });
}

/**
 * Catalog from the Shopify Storefront API, in the Spanish market context. Product ids
 * are variant GIDs (the cart merchandise id); each product carries all its variants
 * and findById() resolves a variant GID to its product with that variant selected (a
 * GraphQL `node` lookup). findAll() orders products by their `custom.position` metafield
 * (see sortByPosition). Products that cannot be mapped, or are priced in a currency
 * other than `currency`, are left out of findAll() and are NotFoundError for
 * findById()/findBySlug().
 */
export class ShopifyProductAdapter implements ProductRepository {
  constructor(
    private readonly client: ShopifyClient,
    private readonly currency: CurrencyCode,
  ) {}

  async findAll(): Promise<Product[]> {
    const nodes: ShopifyProductWithVariants[] = [];
    let after: string | null = null;
    do {
      const page: ProductsPage = await this.client.request<ProductsPage>(PRODUCTS_QUERY, { first: PAGE_SIZE, after });
      nodes.push(...page.products.nodes);
      const { hasNextPage, endCursor } = page.products.pageInfo;
      after = hasNextPage ? endCursor : null;
    } while (after);
    return sortByPosition(nodes)
      .map((node) => mapWithDefaultVariant(node, this.currency))
      .filter((product): product is Product => product !== null);
  }

  async findById(id: ProductId): Promise<Product> {
    if (!id.value.startsWith(VARIANT_GID_PREFIX)) {
      throw new NotFoundError(`Product ${id.value} not found`);
    }
    const { node } = await this.client.request<{
      node: (Partial<ShopifyVariantNode> & { product?: ShopifyProductWithVariants }) | null;
    }>(VARIANT_BY_ID_QUERY, { id: id.value });
    const mapped = node?.product
      ? mapOrSkip(node.product, node as ShopifyVariantNode, node.product.variants?.nodes, this.currency)
      : null;
    if (!mapped) throw new NotFoundError(`Product ${id.value} not found`);
    return mapped;
  }

  async findBySlug(slug: string): Promise<Product> {
    const { product } = await this.client.request<{ product: ShopifyProductWithVariants | null }>(
      PRODUCT_BY_HANDLE_QUERY,
      { handle: slug },
    );
    const mapped = product ? mapWithDefaultVariant(product, this.currency) : null;
    if (!mapped) throw new NotFoundError(`Product with slug ${slug} not found`);
    return mapped;
  }
}
