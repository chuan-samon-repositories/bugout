import { describe, test, expect } from 'vitest';
import { GetProductByIdUseCase } from './GetProductByIdUseCase';
import { ProductRepository } from '../ports/ProductRepository';
import { Product } from '../../domain/entities/product/Product';
import { ProductId } from '../../domain/value-objects/ProductId';
import { Money } from '../../domain/value-objects/Money';
import { NotFoundError } from '../../domain/errors/DomainError';

describe('GetProductByIdUseCase', () => {
  test('execute returns product with matching id from repository', async () => {
    // Arrange
    const testProduct = new Product(
      new ProductId('test-1'),
      'Test Product',
      new Money(100),
      null,
      4.5,
      10,
      'Test description',
      'test-category',
      true,
      null
    );

    const mockRepository: ProductRepository = {
      findAll: async () => [testProduct],
      findById: async (id: ProductId) => {
        if (id.value === 'test-1') {
          return testProduct;
        }
        throw new NotFoundError(`Product with id ${id.value} not found`);
      },
      findByCategory: async () => [testProduct],
      search: async () => [testProduct],
    };

    const useCase = new GetProductByIdUseCase(mockRepository);

    // Act
    const result = await useCase.execute(new ProductId('test-1'));

    // Assert
    expect(result).toEqual(testProduct);
    expect(result.id.value).toBe('test-1');
    expect(result.name).toBe('Test Product');
    expect(result.price.amount).toBe(100);
  });

  test('execute throws NotFoundError when product does not exist', async () => {
    // Arrange
    const mockRepository: ProductRepository = {
      findAll: async () => [],
      findById: async (id: ProductId) => {
        throw new NotFoundError(`Product with id ${id.value} not found`);
      },
      findByCategory: async () => [],
      search: async () => [],
    };

    const useCase = new GetProductByIdUseCase(mockRepository);

    // Act & Assert
    await expect(useCase.execute(new ProductId('non-existent'))).rejects.toThrow(NotFoundError);
    await expect(useCase.execute(new ProductId('non-existent'))).rejects.toThrow('Product with id non-existent not found');
  });

  test('execute propagates repository errors', async () => {
    // Arrange
    const mockRepository: ProductRepository = {
      findAll: async () => {
        throw new Error('Not implemented');
      },
      findById: async () => {
        throw new Error('Repository connection error');
      },
      findByCategory: async () => {
        throw new Error('Not implemented');
      },
      search: async () => {
        throw new Error('Not implemented');
      },
    };

    const useCase = new GetProductByIdUseCase(mockRepository);

    // Act & Assert
    await expect(useCase.execute(new ProductId('test-1'))).rejects.toThrow('Repository connection error');
  });

  test('execute works with products that have sale prices', async () => {
    // Arrange
    const saleProduct = new Product(
      new ProductId('sale-1'),
      'Sale Product',
      new Money(80),
      new Money(100),
      4.8,
      50,
      'Product on sale',
      'sale-category',
      true,
      'BESTSELLER'
    );

    const mockRepository: ProductRepository = {
      findAll: async () => [saleProduct],
      findById: async (id: ProductId) => {
        if (id.value === 'sale-1') {
          return saleProduct;
        }
        throw new NotFoundError(`Product with id ${id.value} not found`);
      },
      findByCategory: async () => [saleProduct],
      search: async () => [saleProduct],
    };

    const useCase = new GetProductByIdUseCase(mockRepository);

    // Act
    const result = await useCase.execute(new ProductId('sale-1'));

    // Assert
    expect(result).toEqual(saleProduct);
    expect(result.isOnSale()).toBe(true);
    expect(result.discountPercentage()).toBe(20);
    expect(result.badge).toBe('BESTSELLER');
  });
});
