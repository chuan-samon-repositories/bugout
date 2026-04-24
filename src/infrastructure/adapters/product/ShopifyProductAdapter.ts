import { ProductRepository } from '../../../application/ports/ProductRepository';
import { Product } from '../../../domain/entities/product/Product';
import { ProductId } from '../../../domain/value-objects/ProductId';
import { Money } from '../../../domain/value-objects/Money';
import { NotFoundError } from '../../../domain/errors';
import { ShopifyConfig } from '../../config/ShopifyConfig';

// ---------------------------------------------------------------------------
// Shopify Storefront API types
// ---------------------------------------------------------------------------

interface ShopifyVariantNode {
  id: string;
  price: { amount: string };
  compareAtPrice: { amount: string } | null;
  availableForSale: boolean;
}

interface ShopifyProductNode {
  id: string;
  title: string;
  description: string;
  productType: string;
  variants: { edges: Array<{ node: ShopifyVariantNode }> };
  // Ratings/reviews are not native to Shopify — extend via metafields if needed.
  // e.g. metafield(namespace: "custom", key: "badge") { value }
  badge: { value: string } | null;
}

// ---------------------------------------------------------------------------
// GraphQL queries
// ---------------------------------------------------------------------------

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          productType
          variants(first: 1) {
            edges {
              node {
                id
                price { amount }
                compareAtPrice { amount }
                availableForSale
              }
            }
          }
          badge: metafield(namespace: "custom", key: "badge") { value }
        }
      }
    }
  }
`;

const PRODUCT_BY_VARIANT_QUERY = `
  query GetProductByVariant($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        id
        price { amount }
        compareAtPrice { amount }
        availableForSale
        product {
          id
          title
          description
          productType
          badge: metafield(namespace: "custom", key: "badge") { value }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class ShopifyProductAdapter implements ProductRepository {
  private readonly endpoint: string;
  private readonly headers: HeadersInit;

  constructor(config: ShopifyConfig) {
    const version = config.apiVersion ?? '2024-01';
    this.endpoint = `https://${config.storeDomain}/api/${version}/graphql.json`;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
    };
  }

  async findAll(): Promise<Product[]> {
    const { data } = await this.graphql<{
      products: { edges: Array<{ node: ShopifyProductNode }> };
    }>(PRODUCTS_QUERY, { first: 250 });
    return data.products.edges.map(({ node }) => this.mapToProduct(node));
  }

  async findById(id: ProductId): Promise<Product> {
    // ProductId.value holds the Shopify variant GID: "gid://shopify/ProductVariant/12345"
    const { data } = await this.graphql<{ node: ShopifyVariantNode & { product: Omit<ShopifyProductNode, 'variants'> } | null }>(
      PRODUCT_BY_VARIANT_QUERY,
      { id: id.value },
    );
    if (!data.node) throw new NotFoundError(`Product ${id.value} not found`);

    const variant = data.node;
    const product = variant.product;
    return new Product(
      new ProductId(variant.id),
      product.title,
      new Money(parseFloat(variant.price.amount)),
      variant.compareAtPrice ? new Money(parseFloat(variant.compareAtPrice.amount)) : null,
      0,
      0,
      product.description,
      product.productType.toLowerCase().replace(/\s+/g, '-'),
      variant.availableForSale,
      product.badge?.value ?? null,
    );
  }

  async findByCategory(category: string): Promise<Product[]> {
    const products = await this.findAll();
    return products.filter((p) => p.category === category);
  }

  async search(query: string): Promise<Product[]> {
    const products = await this.findAll();
    const lower = query.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower),
    );
  }

  private async graphql<T>(query: string, variables: Record<string, unknown>): Promise<{ data: T }> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  private mapToProduct(node: ShopifyProductNode): Product {
    const variant = node.variants.edges[0]?.node;
    if (!variant) throw new Error(`Product ${node.id} has no variants`);
    return new Product(
      new ProductId(variant.id), // variant GID is the stable cart line identifier
      node.title,
      new Money(parseFloat(variant.price.amount)),
      variant.compareAtPrice ? new Money(parseFloat(variant.compareAtPrice.amount)) : null,
      0, // rating — extend via Shopify metafields (e.g. namespace: "reviews", key: "rating")
      0, // reviews
      node.description,
      node.productType.toLowerCase().replace(/\s+/g, '-'),
      variant.availableForSale,
      node.badge?.value ?? null,
    );
  }
}
