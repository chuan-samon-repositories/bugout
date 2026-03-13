import { Product } from '../../domain/entities/product/Product';
import { ProductId } from '../../domain/value-objects/ProductId';

/**
 * Port interface defining the contract for product data access operations.
 * This interface decouples the application layer from infrastructure implementations,
 * allowing different adapters (JSON, REST API, etc.) to be swapped without modifying business logic.
 * 
 * Implementations must handle:
 * - Data retrieval from external sources
 * - Transformation of raw data into Product domain entities
 * - Error handling and validation
 * - NotFoundError when products don't exist
 */
export interface ProductRepository {
  /**
   * Retrieves all products from the data source.
   * @returns Promise resolving to an array of all Product entities
   * @throws Error if data source is unavailable or data is invalid
   */
  findAll(): Promise<Product[]>;

  /**
   * Retrieves a single product by its unique identifier.
   * @param id - The ProductId to search for
   * @returns Promise resolving to the Product entity
   * @throws NotFoundError if product with given id doesn't exist
   * @throws Error if data source is unavailable
   */
  findById(id: ProductId): Promise<Product>;

  /**
   * Retrieves all products belonging to a specific category.
   * @param category - The category name to filter by
   * @returns Promise resolving to an array of Product entities in the category
   * @throws Error if data source is unavailable
   */
  findByCategory(category: string): Promise<Product[]>;

  /**
   * Searches for products matching a query string.
   * The search should be case-insensitive and match against product names and descriptions.
   * @param query - The search query string
   * @returns Promise resolving to an array of matching Product entities
   * @throws Error if data source is unavailable
   */
  search(query: string): Promise<Product[]>;
}
