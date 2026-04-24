import { ProductRepository } from "../../../application/ports/ProductRepository";
import { Product } from "../../../domain/entities/product/Product";
import { ProductId } from "../../../domain/value-objects/ProductId";
import { Money } from "../../../domain/value-objects/Money";
import { NotFoundError } from "../../../domain/errors";
import { ProductDTO } from "@/domain/entities/product/ProductDTOI";

/**
 * Infrastructure adapter implementing ProductRepository by fetching from a REST API.
 * This adapter communicates with a backend API to retrieve product data and transforms
 * it into Product domain entities.
 *
 * Features:
 * - Configurable base URL and authentication token
 * - Automatic retry logic with exponential backoff for transient failures
 * - Proper error handling and transformation to domain errors
 * - Authentication header injection
 *
 * Responsibilities:
 * - Make HTTP requests to the REST API
 * - Handle authentication via Bearer token
 * - Retry failed requests with exponential backoff
 * - Transform API responses into Product entities
 * - Transform HTTP errors into appropriate domain errors
 */
export class ApiProductAdapter implements ProductRepository {
  private readonly baseUrl: string;
  private readonly authToken?: string;

  /**
   * Creates a new ApiProductAdapter instance.
   * @param config - Configuration object containing baseUrl and optional authToken
   * @param config.baseUrl - The base URL of the REST API (e.g., "https://api.example.com")
   * @param config.authToken - Optional authentication token for API requests
   */
  constructor(config: { baseUrl: string; authToken?: string }) {
    this.baseUrl = config.baseUrl;
    this.authToken = config.authToken;
  }

  /**
   * Retrieves all products from the API.
   * @returns Promise resolving to an array of all Product entities
   * @throws Error if the API request fails after retries
   */
  async findAll(): Promise<Product[]> {
    const response = await this.fetchWithRetry("/products");
    return this.mapToProducts(response);
  }

  /**
   * Retrieves a single product by its unique identifier.
   * @param id - The ProductId to search for
   * @returns Promise resolving to the Product entity
   * @throws NotFoundError if product with given id doesn't exist (404 response)
   * @throws Error if the API request fails
   */
  async findById(id: ProductId): Promise<Product> {
    const response = await this.fetchWithRetry(`/products/${id.value}`);
    return this.mapToProducts(response)[0];
  }

  /**
   * Retrieves all products belonging to a specific category.
   * @param category - The category name to filter by
   * @returns Promise resolving to an array of Product entities in the category
   * @throws Error if the API request fails
   */
  async findByCategory(category: string): Promise<Product[]> {
    const response = await this.fetchWithRetry(
      `/products?category=${category}`,
    );
    return this.mapToProducts(response);
  }

  /**
   * Searches for products matching a query string.
   * @param query - The search query string
   * @returns Promise resolving to an array of matching Product entities
   * @throws Error if the API request fails
   */
  async search(query: string): Promise<Product[]> {
    const response = await this.fetchWithRetry(
      `/products/search?q=${encodeURIComponent(query)}`,
    );
    return this.mapToProducts(response);
  }

  /**
   * Private helper method to make HTTP requests with retry logic and exponential backoff.
   * Automatically adds authentication headers if authToken is configured.
   * Retries transient failures (network errors, 5xx server errors) up to the specified number of times.
   *
   * @param endpoint - The API endpoint path (e.g., "/products")
   * @param retries - Maximum number of retry attempts (default: 3)
   * @returns Promise resolving to the parsed JSON response
   * @throws NotFoundError if the API returns 404
   * @throws Error if the request fails after all retries
   */
  private async fetchWithRetry(
    endpoint: string,
    retries = 3,
  ): Promise<ProductDTO | ProductDTO[]> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

        if (!response.ok) {
          if (response.status === 404) {
            throw new NotFoundError(`Resource not found: ${endpoint}`);
          }
          throw new Error(
            `API error: ${response.status} ${response.statusText}`,
          );
        }

        return await response.json();
      } catch (error) {
        // If it's a NotFoundError, don't retry - the resource doesn't exist
        if (error instanceof NotFoundError) {
          throw error;
        }

        // If this was the last retry, throw the error
        if (i === retries - 1) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        await this.delay(Math.pow(2, i) * 1000);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error("Failed to fetch after all retries");
  }

  /**
   * Private helper method to delay execution for a specified duration.
   * Used for implementing exponential backoff between retry attempts.
   *
   * @param ms - Number of milliseconds to delay
   * @returns Promise that resolves after the specified delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Private helper method to transform a single API response object into a Product entity.
   * Creates appropriate value objects (ProductId, Money) from the raw API data.
   *
   * @param data - Raw API response object for a single product
   * @returns Product entity
   * @throws ValidationError if the product data violates domain constraints
   */
  private mapToProduct(data: ProductDTO): Product {
    return new Product(
      new ProductId(data.id),
      data.name,
      new Money(data.price),
      data.originalPrice ? new Money(data.originalPrice) : null,
      data.rating,
      data.reviews,
      data.description,
      data.category,
      data.inStock,
      data.badge || null,
    );
  }

  /**
   * Private helper method to transform an array of API response objects into Product entities.
   *
   * @param data - Array of raw API response objects
   * @returns Array of Product entities
   * @throws ValidationError if any product data violates domain constraints
   */
  private mapToProducts(data: ProductDTO[] | ProductDTO): Product[] {
    return Array.isArray(data)
      ? data.map((item) => this.mapToProduct(item))
      : [this.mapToProduct(data)];
  }
}
