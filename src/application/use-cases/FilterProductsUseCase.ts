import { Product } from '../../domain/entities/product/Product';
import { ProductRepository } from '../ports/ProductRepository';
import { FilterCriteria, SortOption } from '../dtos/FilterCriteria';

/**
 * Use case for filtering and sorting products based on various criteria.
 * Implements filtering by category, price range, stock status, and sale status.
 * Implements sorting by price, rating, reviews, and featured status.
 * 
 * Validates: Requirements 2.4, 2.5, 8.1, 8.2, 8.3
 */
export class FilterProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  /**
   * Executes the filtering and sorting logic based on provided criteria.
   * @param criteria - The filter and sort criteria to apply
   * @returns Promise resolving to filtered and sorted Product array
   */
  async execute(criteria: FilterCriteria): Promise<Product[]> {
    let products = await this.productRepository.findAll();

    // Apply category filter
    if (criteria.category && criteria.category !== "all") {
      products = products.filter(p => p.category === criteria.category);
    }

    // Apply price range filter
    products = products.filter(p => 
      p.price.amount >= criteria.priceRange.min &&
      p.price.amount <= criteria.priceRange.max
    );

    // Apply stock filter
    if (criteria.inStockOnly) {
      products = products.filter(p => p.inStock);
    }

    // Apply sale filter
    if (criteria.onSaleOnly) {
      products = products.filter(p => p.isOnSale());
    }

    // Apply sorting
    return this.sortProducts(products, criteria.sortBy);
  }

  /**
   * Sorts products based on the specified sort option.
   * @param products - Array of products to sort
   * @param sortBy - The sort option to apply
   * @returns Sorted array of products
   */
  private sortProducts(products: Product[], sortBy: SortOption): Product[] {
    const sorted = [...products];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price.amount - b.price.amount);
      case "price-high":
        return sorted.sort((a, b) => b.price.amount - a.price.amount);
      case "rating":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "reviews":
        return sorted.sort((a, b) => b.reviews - a.reviews);
      default:
        return sorted.sort((a, b) => (b.isFeatured() ? 1 : 0) - (a.isFeatured() ? 1 : 0));
    }
  }
}
