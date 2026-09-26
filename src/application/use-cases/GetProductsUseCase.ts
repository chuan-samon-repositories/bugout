import { Product } from '@/domain/entities/product/Product';
import { ProductRepository } from '@/application/ports/ProductRepository';

export class GetProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  execute(): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}
