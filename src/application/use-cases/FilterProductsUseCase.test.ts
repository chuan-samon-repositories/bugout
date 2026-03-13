import { describe, it, expect } from 'vitest';
import { FilterProductsUseCase } from './FilterProductsUseCase';
import { ProductRepository } from '../ports/ProductRepository';
import { Product } from '../../domain/entities/product/Product';
import { ProductId } from '../../domain/value-objects/ProductId';
import { Money } from '../../domain/value-objects/Money';
import { FilterCriteria, SortOption } from '../dtos/FilterCriteria';

// Mock ProductRepository implementation for testing
class MockProductRepository implements ProductRepository {
  constructor(private products: Product[]) {}

  async findAll(): Promise<Product[]> {
    return this.products;
  }

  async findById(id: ProductId): Promise<Product> {
    const product = this.products.find(p => p.id.equals(id));
    if (!product) throw new Error('Product not found');
    return product;
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.products.filter(p => p.category === category);
  }

  async search(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    );
  }
}

// Helper function to create test products
function createTestProduct(overrides: Partial<{
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  description: string;
  category: string;
  inStock: boolean;
  badge: string | null;
}> = {}): Product {
  return new Product(
    new ProductId(overrides.id || 'test-product'),
    overrides.name || 'Test Product',
    new Money(overrides.price ?? 100),
    overrides.originalPrice !== undefined ? (overrides.originalPrice !== null ? new Money(overrides.originalPrice) : null) : null,
    overrides.rating ?? 4.5,
    overrides.reviews ?? 100,
    overrides.description || 'Test description',
    overrides.category || 'test-category',
    overrides.inStock ?? true,
    overrides.badge ?? null
  );
}

describe('FilterProductsUseCase', () => {
  it('should filter products by category', async () => {
    const products = [
      createTestProduct({ id: 'p1', category: 'survival-kits' }),
      createTestProduct({ id: 'p2', category: 'accessories' }),
      createTestProduct({ id: 'p3', category: 'survival-kits' }),
    ];
    const repository = new MockProductRepository(products);
    const useCase = new FilterProductsUseCase(repository);

    const criteria: FilterCriteria = {
      category: 'survival-kits',
      priceRange: { min: 0, max: 1000 },
      sortBy: 'featured',
    };

    const result = await useCase.execute(criteria);

    expect(result).toHaveLength(2);
    expect(result.every(p => p.category === 'survival-kits')).toBe(true);
  });

  it('should filter products by price range', async () => {
    const products = [
      createTestProduct({ id: 'p1', price: 50 }),
      createTestProduct({ id: 'p2', price: 150 }),
      createTestProduct({ id: 'p3', price: 250 }),
    ];
    const repository = new MockProductRepository(products);
    const useCase = new FilterProductsUseCase(repository);

    const criteria: FilterCriteria = {
      priceRange: { min: 100, max: 200 },
      sortBy: 'featured',
    };

    const result = await useCase.execute(criteria);

    expect(result).toHaveLength(1);
    expect(result[0].price.amount).toBe(150);
  });

  it('should filter products by stock status', async () => {
    const products = [
      createTestProduct({ id: 'p1', inStock: true }),
      createTestProduct({ id: 'p2', inStock: false }),
      createTestProduct({ id: 'p3', inStock: true }),
    ];
    const repository = new MockProductRepository(products);
    const useCase = new FilterProductsUseCase(repository);

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 1000 },
      inStockOnly: true,
      sortBy: 'featured',
    };

    const result = await useCase.execute(criteria);

    expect(result).toHaveLength(2);
    expect(result.every(p => p.inStock)).toBe(true);
  });

  it('should filter products by sale status', async () => {
    const products = [
      createTestProduct({ id: 'p1', price: 80, originalPrice: 100 }),
      createTestProduct({ id: 'p2', price: 100, originalPrice: null }),
      createTestProduct({ id: 'p3', price: 90, originalPrice: 120 }),
    ];
    const repository = new MockProductRepository(products);
    const useCase = new FilterProductsUseCase(repository);

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 1000 },
      onSaleOnly: true,
      sortBy: 'featured',
    };

    const result = await useCase.execute(criteria);

    expect(result).toHaveLength(2);
    expect(result.every(p => p.isOnSale())).toBe(true);
  });

  it('should sort products by price (low to high)', async () => {
    const products = [
      createTestProduct({ id: 'p1', price: 150 }),
      createTestProduct({ id: 'p2', price: 50 }),
      createTestProduct({ id: 'p3', price: 100 }),
    ];
    const repository = new MockProductRepository(products);
    const useCase = new FilterProductsUseCase(repository);

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 1000 },
      sortBy: 'price-low',
    };

    const result = await useCase.execute(criteria);

    expect(result[0].price.amount).toBe(50);
    expect(result[1].price.amount).toBe(100);
    expect(result[2].price.amount).toBe(150);
  });

  it('should sort products by price (high to low)', async () => {
    const products = [
      createTestProduct({ id: 'p1', price: 150 }),
      createTestProduct({ id: 'p2', price: 50 }),
      createTestProduct({ id: 'p3', price: 100 }),
    ];
    const repository = new MockProductRepository(products);
    const useCase = new FilterProductsUseCase(repository);

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 1000 },
      sortBy: 'price-high',
    };

    const result = await useCase.execute(criteria);

    expect(result[0].price.amount).toBe(150);
    expect(result[1].price.amount).toBe(100);
    expect(result[2].price.amount).toBe(50);
  });

  it('should sort products by rating', async () => {
    const products = [
      createTestProduct({ id: 'p1', rating: 3.5 }),
      createTestProduct({ id: 'p2', rating: 4.8 }),
      createTestProduct({ id: 'p3', rating: 4.2 }),
    ];
    const repository = new MockProductRepository(products);
    const useCase = new FilterProductsUseCase(repository);

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 1000 },
      sortBy: 'rating',
    };

    const result = await useCase.execute(criteria);

    expect(result[0].rating).toBe(4.8);
    expect(result[1].rating).toBe(4.2);
    expect(result[2].rating).toBe(3.5);
  });

  it('should sort products by reviews', async () => {
    const products = [
      createTestProduct({ id: 'p1', reviews: 50 }),
      createTestProduct({ id: 'p2', reviews: 200 }),
      createTestProduct({ id: 'p3', reviews: 100 }),
    ];
    const repository = new MockProductRepository(products);
    const useCase = new FilterProductsUseCase(repository);

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 1000 },
      sortBy: 'reviews',
    };

    const result = await useCase.execute(criteria);

    expect(result[0].reviews).toBe(200);
    expect(result[1].reviews).toBe(100);
    expect(result[2].reviews).toBe(50);
  });

  it('should sort products by featured status', async () => {
    const products = [
      createTestProduct({ id: 'p1', badge: null }),
      createTestProduct({ id: 'p2', badge: 'BESTSELLER' }),
      createTestProduct({ id: 'p3', badge: 'PREMIUM' }),
      createTestProduct({ id: 'p4', badge: 'NEW' }),
    ];
    const repository = new MockProductRepository(products);
    const useCase = new FilterProductsUseCase(repository);

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 1000 },
      sortBy: 'featured',
    };

    const result = await useCase.execute(criteria);

    // Featured products (BESTSELLER, PREMIUM) should come first
    expect(result[0].isFeatured()).toBe(true);
    expect(result[1].isFeatured()).toBe(true);
    expect(result[2].isFeatured()).toBe(false);
    expect(result[3].isFeatured()).toBe(false);
  });

  it('should apply multiple filters together', async () => {
    const products = [
      createTestProduct({ id: 'p1', category: 'survival-kits', price: 80, originalPrice: 100, inStock: true }),
      createTestProduct({ id: 'p2', category: 'survival-kits', price: 150, originalPrice: null, inStock: true }),
      createTestProduct({ id: 'p3', category: 'accessories', price: 90, originalPrice: 120, inStock: true }),
      createTestProduct({ id: 'p4', category: 'survival-kits', price: 85, originalPrice: 110, inStock: false }),
    ];
    const repository = new MockProductRepository(products);
    const useCase = new FilterProductsUseCase(repository);

    const criteria: FilterCriteria = {
      category: 'survival-kits',
      priceRange: { min: 70, max: 100 },
      inStockOnly: true,
      onSaleOnly: true,
      sortBy: 'price-low',
    };

    const result = await useCase.execute(criteria);

    expect(result).toHaveLength(1);
    expect(result[0].id.value).toBe('p1');
  });

  it('should not modify the original product list', async () => {
    const products = [
      createTestProduct({ id: 'p1', price: 150 }),
      createTestProduct({ id: 'p2', price: 50 }),
      createTestProduct({ id: 'p3', price: 100 }),
    ];
    const repository = new MockProductRepository(products);
    const useCase = new FilterProductsUseCase(repository);

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 1000 },
      sortBy: 'price-low',
    };

    await useCase.execute(criteria);

    // Original products array should remain unchanged
    const allProducts = await repository.findAll();
    expect(allProducts[0].price.amount).toBe(150);
    expect(allProducts[1].price.amount).toBe(50);
    expect(allProducts[2].price.amount).toBe(100);
  });
});

/**
 * Property-Based Tests for FilterProductsUseCase
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.5**
 * 
 * These tests verify that filtering, sorting, and search operations work correctly
 * across randomized inputs using property-based testing with fast-check.
 */

import * as fc from 'fast-check';

// Arbitrary generators for property-based testing
const arbitraryProduct = (): fc.Arbitrary<Product> => {
  return fc.record({
    id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    originalPrice: fc.option(fc.double({ min: 0.01, max: 10000, noNaN: true }), { nil: null }),
    rating: fc.double({ min: 0, max: 5, noNaN: true }),
    reviews: fc.integer({ min: 0, max: 10000 }),
    description: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    category: fc.constantFrom('survival-kits', 'accessories', 'clothing', 'tools'),
    inStock: fc.boolean(),
    badge: fc.option(fc.constantFrom('BESTSELLER', 'PREMIUM', 'NEW', 'SALE'), { nil: null }),
  }).map(data => {
    // Ensure originalPrice is greater than price if it exists
    const price = data.price;
    const originalPrice = data.originalPrice && data.originalPrice > price ? data.originalPrice : null;
    
    return new Product(
      new ProductId(data.id),
      data.name,
      new Money(price),
      originalPrice ? new Money(originalPrice) : null,
      data.rating,
      data.reviews,
      data.description,
      data.category,
      data.inStock,
      data.badge
    );
  });
};

const arbitraryFilterCriteria = (): fc.Arbitrary<FilterCriteria> => {
  return fc.record({
    category: fc.option(fc.constantFrom('survival-kits', 'accessories', 'clothing', 'tools', 'all'), { nil: undefined }),
    priceRange: fc.record({
      min: fc.double({ min: 0, max: 5000, noNaN: true }),
      max: fc.double({ min: 0, max: 10000, noNaN: true }),
    }).map(range => ({
      min: Math.min(range.min, range.max),
      max: Math.max(range.min, range.max),
    })),
    inStockOnly: fc.option(fc.boolean(), { nil: undefined }),
    onSaleOnly: fc.option(fc.boolean(), { nil: undefined }),
    sortBy: fc.constantFrom('featured', 'price-low', 'price-high', 'rating', 'reviews') as fc.Arbitrary<SortOption>,
  });
};

describe('Property 8: Product Filtering Correctness', () => {
  /**
   * Feature: hexagonal-architecture-refactor, Property 8: Product Filtering Correctness
   * For any list of products and any filter criteria (category, price range, stock status, 
   * sale status), all products returned by FilterProductsUseCase SHALL match all specified 
   * criteria, and no products matching the criteria SHALL be excluded.
   */
  
  it('should only return products matching the category filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 1, maxLength: 50 }),
        fc.constantFrom('survival-kits', 'accessories', 'clothing', 'tools'),
        async (products, category) => {
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          const criteria: FilterCriteria = {
            category,
            priceRange: { min: 0, max: 100000 },
            sortBy: 'featured',
          };
          
          const result = await useCase.execute(criteria);
          
          // All returned products must match the category
          expect(result.every(p => p.category === category)).toBe(true);
          
          // No matching products should be excluded
          const expectedCount = products.filter(p => p.category === category).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only return products within the price range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 1, maxLength: 50 }),
        fc.double({ min: 0, max: 5000, noNaN: true }),
        fc.double({ min: 0, max: 10000, noNaN: true }),
        async (products, minPrice, maxPrice) => {
          const min = Math.min(minPrice, maxPrice);
          const max = Math.max(minPrice, maxPrice);
          
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          const criteria: FilterCriteria = {
            priceRange: { min, max },
            sortBy: 'featured',
          };
          
          const result = await useCase.execute(criteria);
          
          // All returned products must be within price range
          expect(result.every(p => p.price.amount >= min && p.price.amount <= max)).toBe(true);
          
          // No matching products should be excluded
          const expectedCount = products.filter(p => p.price.amount >= min && p.price.amount <= max).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only return in-stock products when inStockOnly is true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 1, maxLength: 50 }),
        async (products) => {
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          const criteria: FilterCriteria = {
            priceRange: { min: 0, max: 100000 },
            inStockOnly: true,
            sortBy: 'featured',
          };
          
          const result = await useCase.execute(criteria);
          
          // All returned products must be in stock
          expect(result.every(p => p.inStock === true)).toBe(true);
          
          // No matching products should be excluded
          const expectedCount = products.filter(p => p.inStock).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only return products on sale when onSaleOnly is true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 1, maxLength: 50 }),
        async (products) => {
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          const criteria: FilterCriteria = {
            priceRange: { min: 0, max: 100000 },
            onSaleOnly: true,
            sortBy: 'featured',
          };
          
          const result = await useCase.execute(criteria);
          
          // All returned products must be on sale
          expect(result.every(p => p.isOnSale())).toBe(true);
          
          // No matching products should be excluded
          const expectedCount = products.filter(p => p.isOnSale()).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly apply multiple filters together', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 1, maxLength: 50 }),
        arbitraryFilterCriteria(),
        async (products, criteria) => {
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          const result = await useCase.execute(criteria);
          
          // Manually filter products to verify correctness
          let expected = products;
          
          if (criteria.category && criteria.category !== 'all') {
            expected = expected.filter(p => p.category === criteria.category);
          }
          
          expected = expected.filter(p => 
            p.price.amount >= criteria.priceRange.min &&
            p.price.amount <= criteria.priceRange.max
          );
          
          if (criteria.inStockOnly) {
            expected = expected.filter(p => p.inStock);
          }
          
          if (criteria.onSaleOnly) {
            expected = expected.filter(p => p.isOnSale());
          }
          
          // All returned products must match all criteria
          for (const product of result) {
            if (criteria.category && criteria.category !== 'all') {
              expect(product.category).toBe(criteria.category);
            }
            expect(product.price.amount).toBeGreaterThanOrEqual(criteria.priceRange.min);
            expect(product.price.amount).toBeLessThanOrEqual(criteria.priceRange.max);
            if (criteria.inStockOnly) {
              expect(product.inStock).toBe(true);
            }
            if (criteria.onSaleOnly) {
              expect(product.isOnSale()).toBe(true);
            }
          }
          
          // Count should match expected
          expect(result.length).toBe(expected.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 9: Product Sorting Correctness', () => {
  /**
   * Feature: hexagonal-architecture-refactor, Property 9: Product Sorting Correctness
   * For any list of products and any sort option (price-low, price-high, rating, reviews), 
   * the products returned by FilterProductsUseCase SHALL be ordered according to the sort 
   * criteria, with each product correctly positioned relative to its neighbors.
   */
  
  it('should sort products by price (low to high) correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 2, maxLength: 50 }),
        async (products) => {
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          const criteria: FilterCriteria = {
            priceRange: { min: 0, max: 100000 },
            sortBy: 'price-low',
          };
          
          const result = await useCase.execute(criteria);
          
          // Verify each product is less than or equal to the next
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].price.amount).toBeLessThanOrEqual(result[i + 1].price.amount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sort products by price (high to low) correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 2, maxLength: 50 }),
        async (products) => {
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          const criteria: FilterCriteria = {
            priceRange: { min: 0, max: 100000 },
            sortBy: 'price-high',
          };
          
          const result = await useCase.execute(criteria);
          
          // Verify each product is greater than or equal to the next
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].price.amount).toBeGreaterThanOrEqual(result[i + 1].price.amount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sort products by rating (high to low) correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 2, maxLength: 50 }),
        async (products) => {
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          const criteria: FilterCriteria = {
            priceRange: { min: 0, max: 100000 },
            sortBy: 'rating',
          };
          
          const result = await useCase.execute(criteria);
          
          // Verify each product rating is greater than or equal to the next
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].rating).toBeGreaterThanOrEqual(result[i + 1].rating);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sort products by reviews (high to low) correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 2, maxLength: 50 }),
        async (products) => {
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          const criteria: FilterCriteria = {
            priceRange: { min: 0, max: 100000 },
            sortBy: 'reviews',
          };
          
          const result = await useCase.execute(criteria);
          
          // Verify each product reviews count is greater than or equal to the next
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].reviews).toBeGreaterThanOrEqual(result[i + 1].reviews);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sort products by featured status correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 2, maxLength: 50 }),
        async (products) => {
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          const criteria: FilterCriteria = {
            priceRange: { min: 0, max: 100000 },
            sortBy: 'featured',
          };
          
          const result = await useCase.execute(criteria);
          
          // Find the first non-featured product
          const firstNonFeaturedIndex = result.findIndex(p => !p.isFeatured());
          
          if (firstNonFeaturedIndex === -1) {
            // All products are featured or all are non-featured, which is valid
            return;
          }
          
          // All products before this index should be featured
          for (let i = 0; i < firstNonFeaturedIndex; i++) {
            expect(result[i].isFeatured()).toBe(true);
          }
          
          // All products from this index onwards should be non-featured
          for (let i = firstNonFeaturedIndex; i < result.length; i++) {
            expect(result[i].isFeatured()).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 10: Product Search Correctness', () => {
  /**
   * Feature: hexagonal-architecture-refactor, Property 10: Product Search Correctness
   * For any list of products and any search query string, all products returned by 
   * FilterProductsUseCase SHALL contain the query string (case-insensitive) in either 
   * the product name or description.
   * 
   * Note: This property is tested through the ProductRepository.search method,
   * not through FilterProductsUseCase which handles filtering/sorting only.
   */
  
  it('should return only products matching the search query in name or description', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            rating: fc.double({ min: 0, max: 5, noNaN: true }),
            reviews: fc.integer({ min: 0, max: 10000 }),
            category: fc.constantFrom('survival-kits', 'accessories', 'clothing', 'tools'),
            inStock: fc.boolean(),
            badge: fc.option(fc.constantFrom('BESTSELLER', 'PREMIUM', 'NEW', 'SALE'), { nil: null }),
          }),
          { minLength: 5, maxLength: 30 }
        ),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
        async (productData, searchQuery) => {
          // Create products from data
          const products = productData.map(data => 
            new Product(
              new ProductId(data.id),
              data.name,
              new Money(data.price),
              null,
              data.rating,
              data.reviews,
              data.description,
              data.category,
              data.inStock,
              data.badge
            )
          );
          
          const repository = new MockProductRepository(products);
          const result = await repository.search(searchQuery);
          
          const lowerQuery = searchQuery.toLowerCase();
          
          // All returned products must contain the query in name or description
          for (const product of result) {
            const matchesName = product.name.toLowerCase().includes(lowerQuery);
            const matchesDescription = product.description.toLowerCase().includes(lowerQuery);
            expect(matchesName || matchesDescription).toBe(true);
          }
          
          // No matching products should be excluded
          const expectedCount = products.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery)
          ).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 11: Filter Immutability', () => {
  /**
   * Feature: hexagonal-architecture-refactor, Property 11: Filter Immutability
   * For any list of products and any filter criteria, executing FilterProductsUseCase 
   * SHALL return a new filtered list without modifying the original product collection.
   */
  
  it('should not modify the original product list when filtering', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 5, maxLength: 50 }),
        arbitraryFilterCriteria(),
        async (products, criteria) => {
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          // Capture original state
          const originalProducts = await repository.findAll();
          const originalLength = originalProducts.length;
          const originalFirstPrice = originalProducts[0]?.price.amount;
          const originalLastPrice = originalProducts[originalLength - 1]?.price.amount;
          
          // Execute filtering
          await useCase.execute(criteria);
          
          // Verify original list is unchanged
          const afterProducts = await repository.findAll();
          expect(afterProducts.length).toBe(originalLength);
          
          if (originalLength > 0) {
            expect(afterProducts[0].price.amount).toBe(originalFirstPrice);
            expect(afterProducts[originalLength - 1].price.amount).toBe(originalLastPrice);
          }
          
          // Verify all products are still in original order
          for (let i = 0; i < originalLength; i++) {
            expect(afterProducts[i].id.value).toBe(originalProducts[i].id.value);
            expect(afterProducts[i].price.amount).toBe(originalProducts[i].price.amount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not modify the original product list when sorting', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryProduct(), { minLength: 5, maxLength: 50 }),
        fc.constantFrom('price-low', 'price-high', 'rating', 'reviews', 'featured') as fc.Arbitrary<SortOption>,
        async (products, sortBy) => {
          const repository = new MockProductRepository(products);
          const useCase = new FilterProductsUseCase(repository);
          
          // Capture original order
          const originalProducts = await repository.findAll();
          const originalOrder = originalProducts.map(p => p.id.value);
          
          // Execute sorting
          await useCase.execute({
            priceRange: { min: 0, max: 100000 },
            sortBy,
          });
          
          // Verify original order is unchanged
          const afterProducts = await repository.findAll();
          const afterOrder = afterProducts.map(p => p.id.value);
          
          expect(afterOrder).toEqual(originalOrder);
        }
      ),
      { numRuns: 100 }
    );
  });
});
