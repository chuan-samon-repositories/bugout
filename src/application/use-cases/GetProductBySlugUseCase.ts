import { Product } from '@/domain/entities/product/Product';
import { ProductRepository } from '@/application/ports/ProductRepository';

export class GetProductBySlugUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  /** @throws NotFoundError when no product has this slug */
  execute(slug: string): Promise<Product> {
    return this.productRepository.findBySlug(slug);
  }
}
