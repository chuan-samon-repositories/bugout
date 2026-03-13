import { ProductRepository } from '../../application/ports/ProductRepository';
import { CartRepository } from '../../application/ports/CartRepository';
import { GetProductsUseCase } from '../../application/use-cases/GetProductsUseCase';
import { FilterProductsUseCase } from '../../application/use-cases/FilterProductsUseCase';
import { ManageCartUseCase } from '../../application/use-cases/ManageCartUseCase';
import { JsonProductAdapter } from '../adapters/JsonProductAdapter';
import { ApiProductAdapter } from '../adapters/ApiProductAdapter';
import { LocalStorageCartAdapter } from '../adapters/LocalStorageCartAdapter';

/**
 * Type defining the available adapter implementations for product data.
 * - "json": Uses JsonProductAdapter to read from /product_list.json
 * - "api": Uses ApiProductAdapter to fetch from a REST API
 */
export type AdapterType = "json" | "api";

/**
 * Configuration interface for dependency injection.
 * Defines which adapters to use and their configuration parameters.
 */
export interface DependencyConfig {
  /** The type of product adapter to use (json or api) */
  productAdapterType: AdapterType;
  /** Base URL for the REST API (required when using api adapter) */
  apiBaseUrl?: string;
  /** Authentication token for API requests (optional) */
  apiAuthToken?: string;
}

/**
 * Singleton container managing dependency injection for the application.
 * Provides factory methods for creating use cases with properly configured adapters.
 * 
 * This container:
 * - Implements the singleton pattern to ensure single configuration instance
 * - Creates and configures infrastructure adapters based on configuration
 * - Provides factory methods for use cases with injected dependencies
 * - Enables switching between JSON and API data sources via configuration
 * 
 * Usage:
 * ```typescript
 * // Initialize with configuration
 * DependencyContainer.initialize({ productAdapterType: "json" });
 * 
 * // Get configured use case
 * const useCase = DependencyContainer.getInstance().getGetProductsUseCase();
 * const products = await useCase.execute();
 * ```
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export class DependencyContainer {
  private static instance: DependencyContainer;
  private config: DependencyConfig;

  /**
   * Private constructor to enforce singleton pattern.
   * Use initialize() or getInstance() instead.
   * 
   * @param config - The dependency configuration
   */
  private constructor(config: DependencyConfig) {
    this.config = config;
  }

  /**
   * Initializes the dependency container with the provided configuration.
   * This should be called once at application startup.
   * 
   * @param config - The dependency configuration specifying which adapters to use
   */
  static initialize(config: DependencyConfig): void {
    DependencyContainer.instance = new DependencyContainer(config);
  }

  /**
   * Gets the singleton instance of the dependency container.
   * If not initialized, creates a default instance using JSON adapter.
   * 
   * @returns The DependencyContainer singleton instance
   */
  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      // Default to JSON adapter if not explicitly initialized
      DependencyContainer.instance = new DependencyContainer({
        productAdapterType: "json",
      });
    }
    return DependencyContainer.instance;
  }

  /**
   * Creates and returns a ProductRepository implementation based on configuration.
   * Returns JsonProductAdapter or ApiProductAdapter depending on productAdapterType.
   * 
   * @returns ProductRepository implementation
   */
  getProductRepository(): ProductRepository {
    if (this.config.productAdapterType === "api") {
      return new ApiProductAdapter({
        baseUrl: this.config.apiBaseUrl || "",
        authToken: this.config.apiAuthToken,
      });
    }
    return new JsonProductAdapter();
  }

  /**
   * Creates and returns a CartRepository implementation.
   * Currently always returns LocalStorageCartAdapter.
   * 
   * @returns CartRepository implementation
   */
  getCartRepository(): CartRepository {
    return new LocalStorageCartAdapter();
  }

  /**
   * Creates and returns a GetProductsUseCase with injected ProductRepository.
   * 
   * @returns Configured GetProductsUseCase instance
   */
  getGetProductsUseCase(): GetProductsUseCase {
    return new GetProductsUseCase(this.getProductRepository());
  }

  /**
   * Creates and returns a FilterProductsUseCase with injected ProductRepository.
   * 
   * @returns Configured FilterProductsUseCase instance
   */
  getFilterProductsUseCase(): FilterProductsUseCase {
    return new FilterProductsUseCase(this.getProductRepository());
  }

  /**
   * Creates and returns a ManageCartUseCase with injected repositories.
   * 
   * @returns Configured ManageCartUseCase instance
   */
  getManageCartUseCase(): ManageCartUseCase {
    return new ManageCartUseCase(
      this.getCartRepository(),
      this.getProductRepository()
    );
  }
}

/**
 * Initializes the dependency container with environment-based configuration.
 * Reads configuration from environment variables:
 * - NEXT_PUBLIC_PRODUCT_ADAPTER: "json" or "api" (defaults to "json")
 * - NEXT_PUBLIC_API_BASE_URL: Base URL for REST API
 * - NEXT_PUBLIC_API_AUTH_TOKEN: Authentication token for API requests
 * 
 * This function should be called once at application startup.
 * 
 * Requirements: 4.4, 4.5, 12.5
 */
export function initializeDependencies(): void {
  const config: DependencyConfig = {
    productAdapterType: (process.env.NEXT_PUBLIC_PRODUCT_ADAPTER as AdapterType) || "json",
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    apiAuthToken: process.env.NEXT_PUBLIC_API_AUTH_TOKEN,
  };
  
  DependencyContainer.initialize(config);
}
