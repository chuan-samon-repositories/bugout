import { ProductRepository } from '@/application/ports/ProductRepository';
import { Product } from '@/domain/entities/product/Product';
import { NotFoundError } from '@/domain/errors';
import { ProductId } from '@/domain/value-objects/ProductId';
import {
  PRODUCT_FIELDS_FRAGMENT,
  ShopifyProductNode,
  ShopifyProductWithVariants,
  ShopifyVariantNode,
  VARIANT_FIELDS_FRAGMENT,
  mapShopifyProduct,
} from '../shopify/productMapping';
import { STOREFRONT_CONTEXT, ShopifyClient } from '../shopify/ShopifyClient';

const PAGE_SIZE = 100;
const VARIANT_GID_PREFIX = 'gid://shopify/ProductVariant/';

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $after: String) ${STOREFRONT_CONTEXT} {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ...ProductFields
        variants(first: 1) { nodes { ...VariantFields } }
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
      variants(first: 1) { nodes { ...VariantFields } }
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
        product { ...ProductFields }
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

/**
 * Maps a product and variant, or returns null (with a warning naming the handle and
 * the reason) when Shopify data breaks a domain rule, e.g. a zero price or an invalid
 * handle. One bad product then hides only itself instead of the whole catalog.
 */
function mapOrSkip(node: ShopifyProductNode, variant: ShopifyVariantNode | undefined): Product | null {
  if (!variant) {
    console.warn(`[shopify] Skipping product "${node.handle}": it has no variants`);
    return null;
  }
  try {
    return mapShopifyProduct(node, variant);
  } catch (error) {
    console.warn(`[shopify] Skipping product "${node.handle}": ${reasonOf(error)}`);
    return null;
  }
}

/** Maps a product with its first variant; see mapOrSkip. */
function mapWithFirstVariant(node: ShopifyProductWithVariants): Product | null {
  return mapOrSkip(node, node.variants.nodes[0]);
}

/**
 * Catalog from the Shopify Storefront API, in the Spanish market context. Product ids
 * are variant GIDs (the cart merchandise id). Products that cannot be mapped are left
 * out of findAll() and are NotFoundError for findById()/findBySlug().
 */
export class ShopifyProductAdapter implements ProductRepository {
  constructor(private readonly client: ShopifyClient) {}

  async findAll(): Promise<Product[]> {
    const products: Product[] = [];
    let after: string | null = null;
    do {
      const page: ProductsPage = await this.client.request<ProductsPage>(PRODUCTS_QUERY, { first: PAGE_SIZE, after });
      for (const node of page.products.nodes) {
        const product = mapWithFirstVariant(node);
        if (product) products.push(product);
      }
      const { hasNextPage, endCursor } = page.products.pageInfo;
      after = hasNextPage ? endCursor : null;
    } while (after);
    return products;
  }

  async findById(id: ProductId): Promise<Product> {
    if (!id.value.startsWith(VARIANT_GID_PREFIX)) {
      throw new NotFoundError(`Product ${id.value} not found`);
    }
    const { node } = await this.client.request<{
      node: (Partial<ShopifyVariantNode> & { product?: ShopifyProductNode }) | null;
    }>(VARIANT_BY_ID_QUERY, { id: id.value });
    const mapped = node?.product ? mapOrSkip(node.product, node as ShopifyVariantNode) : null;
    if (!mapped) throw new NotFoundError(`Product ${id.value} not found`);
    return mapped;
  }

  async findBySlug(slug: string): Promise<Product> {
    const { product } = await this.client.request<{ product: ShopifyProductWithVariants | null }>(
      PRODUCT_BY_HANDLE_QUERY,
      { handle: slug },
    );
    const mapped = product ? mapWithFirstVariant(product) : null;
    if (!mapped) throw new NotFoundError(`Product with slug ${slug} not found`);
    return mapped;
  }
}
