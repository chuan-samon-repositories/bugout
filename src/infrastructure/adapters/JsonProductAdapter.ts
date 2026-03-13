import { ProductRepository } from "../../application/ports/ProductRepository";
import { Product } from "../../domain/entities/product/Product";
import { ProductId } from "../../domain/value-objects/ProductId";
import { Money } from "../../domain/value-objects/Money";
import { NotFoundError } from "../../domain/errors";
import { ProductDTO } from "@/domain/entities/product/ProductDTOI";

/**
 * Infrastructure adapter implementing ProductRepository by reading from a JSON file.
 * This adapter fetches product data from /product_list.json and transforms it into Product domain entities.
 *
 * Responsibilities:
 * - Fetch JSON data from the public directory
 * - Transform raw JSON into Product entities with proper value objects
 * - Handle errors and provide clear error messages
 * - Implement all ProductRepository methods (findAll, findById, findByCategory, search)
 */
export class JsonProductAdapter implements ProductRepository {
  private readonly jsonPath = "/product_list.json";

  /**
   * Retrieves all products from the JSON file.
   * @returns Promise resolving to an array of all Product entities
   * @throws Error if the JSON file cannot be fetched or parsed
   */
  async findAll(): Promise<Product[]> {
    try {
      const response = await fetch(this.jsonPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      const data = await response.json();
      return this.mapToProducts(data);
    } catch (error) {
      throw new Error(
        `Error loading products: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Retrieves a single product by its unique identifier.
   * @param id - The ProductId to search for
   * @returns Promise resolving to the Product entity
   * @throws NotFoundError if product with given id doesn't exist
   */
  async findById(id: ProductId): Promise<Product> {
    const products = await this.findAll();
    const product = products.find((p) => p.id.equals(id));
    if (!product) {
      throw new NotFoundError(`Product with id ${id.value} not found`);
    }
    return product;
  }

  /**
   * Retrieves all products belonging to a specific category.
   * @param category - The category name to filter by
   * @returns Promise resolving to an array of Product entities in the category
   */
  async findByCategory(category: string): Promise<Product[]> {
    const products = await this.findAll();
    return products.filter((p) => p.category === category);
  }

  /**
   * Searches for products matching a query string.
   * The search is case-insensitive and matches against product names and descriptions.
   * @param query - The search query string
   * @returns Promise resolving to an array of matching Product entities
   */
  async search(query: string): Promise<Product[]> {
    const products = await this.findAll();
    const lowerQuery = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * Private helper method to transform raw JSON data into Product domain entities.
   * Handles the mapping of JSON fields to Product constructor parameters,
   * creating appropriate value objects (ProductId, Money) for each product.
   *
   * @param data - Array of raw JSON product objects
   * @returns Array of Product entities
   * @throws ValidationError if any product data violates domain constraints
   */
  private mapToProducts(data: ProductDTO[]): Product[] {
    return data.map(
      (item) =>
        new Product(
          new ProductId(item.id),
          item.name,
          new Money(item.price),
          item.originalPrice ? new Money(item.originalPrice) : null,
          item.rating,
          item.reviews,
          item.description,
          item.category,
          item.inStock,
          item.badge || null,
        ),
    );
  }
}
