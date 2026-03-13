import { Product } from '../../domain/entities/product/Product';
import { ProductId } from '../../domain/value-objects/ProductId';
import { ProductRepository } from '../ports/ProductRepository';

/**
 * Use case for retrieving a single product by its ID from the repository.
 * 
 * This use case encapsulates the business logic for fetching a specific product.
 * It depends only on the ProductRepository port interface, allowing different
 * infrastructure adapters (JSON, REST API) to be used without modifying this code.
 * 
 * Requirements: 2.4, 2.5
 */
export class GetProductByIdUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  /**
   * Executes the use case to retrieve a product by its ID.
   * 
   * @param id - The ProductId of the product to retrieve
   * @returns Promise resolving to the Product entity
   * @throws NotFoundError if product with given id doesn't exist
   * @throws Error if the repository fails to retrieve the product
   */
  async execute(id: ProductId): Promise<Product> {
    return await this.productRepository.findById(id);
  }
}
