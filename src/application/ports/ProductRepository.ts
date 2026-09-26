import { Product } from '@/domain/entities/product/Product';
import { ProductId } from '@/domain/value-objects/ProductId';

/**
 * Read access to the product catalog. Implemented by the JSON catalog
 * (local provider) and the Shopify Storefront API.
 */
export interface ProductRepository {
  /** @throws Error if the data source is unavailable or returns invalid data */
  findAll(): Promise<Product[]>;

  /** @throws NotFoundError if no product has this id */
  findById(id: ProductId): Promise<Product>;

  /** @throws NotFoundError if no product has this URL slug */
  findBySlug(slug: string): Promise<Product>;
}
