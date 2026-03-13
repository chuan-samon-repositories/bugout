import { Product } from '../../domain/entities/product/Product';
import { ProductRepository } from '../ports/ProductRepository';

/**
 * Use case for retrieving all products from the repository.
 * 
 * This use case encapsulates the business logic for fetching all available products.
 * It depends only on the ProductRepository port interface, allowing different
 * infrastructure adapters (JSON, REST API) to be used without modifying this code.
 * 
 * Requirements: 2.4, 2.5
 */
export class GetProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  /**
   * Executes the use case to retrieve all products.
   * 
   * @returns Promise resolving to an array of all Product entities
   * @throws Error if the repository fails to retrieve products
   */
  async execute(): Promise<Product[]> {
    return await this.productRepository.findAll();
  }
}
