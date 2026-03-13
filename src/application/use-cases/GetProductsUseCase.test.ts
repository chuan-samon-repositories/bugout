import { describe, test, expect } from 'vitest';
import { GetProductsUseCase } from './GetProductsUseCase';
import { ProductRepository } from '../ports/ProductRepository';
import { Product } from '../../domain/entities/product/Product';
import { ProductId } from '../../domain/value-objects/ProductId';
import { Money } from '../../domain/value-objects/Money';

describe('GetProductsUseCase', () => {
  test('execute returns all products from repository', async () => {
    // Arrange
    const mockProducts: Product[] = [
      new Product(
        new ProductId('test-1'),
        'Test Product 1',
        new Money(100),
        null,
        4.5,
        10,
        'Test description 1',
        'test-category',
        true,
        null
      ),
      new Product(
        new ProductId('test-2'),
        'Test Product 2',
        new Money(200),
        new Money(250),
        4.0,
        20,
        'Test description 2',
        'test-category',
        true,
        'BESTSELLER'
      ),
    ];

    const mockRepository: ProductRepository = {
      findAll: async () => mockProducts,
      findById: async () => mockProducts[0],
      findByCategory: async () => mockProducts,
      search: async () => mockProducts,
    };

    const useCase = new GetProductsUseCase(mockRepository);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toEqual(mockProducts);
    expect(result).toHaveLength(2);
    expect(result[0].id.value).toBe('test-1');
    expect(result[1].id.value).toBe('test-2');
  });

  test('execute propagates repository errors', async () => {
    // Arrange
    const mockRepository: ProductRepository = {
      findAll: async () => {
        throw new Error('Repository error');
      },
      findById: async () => {
        throw new Error('Not implemented');
      },
      findByCategory: async () => {
        throw new Error('Not implemented');
      },
      search: async () => {
        throw new Error('Not implemented');
      },
    };

    const useCase = new GetProductsUseCase(mockRepository);

    // Act & Assert
    await expect(useCase.execute()).rejects.toThrow('Repository error');
  });

  test('execute returns empty array when no products exist', async () => {
    // Arrange
    const mockRepository: ProductRepository = {
      findAll: async () => [],
      findById: async () => {
        throw new Error('Not implemented');
      },
      findByCategory: async () => [],
      search: async () => [],
    };

    const useCase = new GetProductsUseCase(mockRepository);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});
