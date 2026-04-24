import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ApiProductAdapter } from './ApiProductAdapter';
import { ProductId } from '../../../domain/value-objects/ProductId';
import { NotFoundError } from '../../../domain/errors';
import { Product } from '../../../domain/entities/product/Product';

describe('ApiProductAdapter', () => {
  let adapter: ApiProductAdapter;
  const mockBaseUrl = 'https://api.example.com';
  const mockAuthToken = 'test-token-123';

  beforeEach(() => {
    adapter = new ApiProductAdapter({
      baseUrl: mockBaseUrl,
      authToken: mockAuthToken,
    });
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    test('fetches all products from API and transforms to Product entities', async () => {
      const mockApiResponse = {
        data: [
          {
            id: 'product-1',
            name: 'Test Product 1',
            price: 99.99,
            originalPrice: 129.99,
            rating: 4.5,
            reviews: 100,
            description: 'Test description 1',
            category: 'test-category',
            inStock: true,
            badge: 'BESTSELLER',
          },
          {
            id: 'product-2',
            name: 'Test Product 2',
            price: 49.99,
            originalPrice: null,
            rating: 4.0,
            reviews: 50,
            description: 'Test description 2',
            category: 'test-category',
            inStock: false,
            badge: null,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const products = await adapter.findAll();

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/products`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockAuthToken}`,
          }),
        })
      );

      expect(products).toHaveLength(2);
      expect(products[0]).toBeInstanceOf(Product);
      expect(products[0].id.value).toBe('product-1');
      expect(products[0].name).toBe('Test Product 1');
      expect(products[0].price.amount).toBe(99.99);
      expect(products[1].id.value).toBe('product-2');
    });

    test('includes authentication header when authToken is provided', async () => {
      const mockApiResponse = { data: [] };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      await adapter.findAll();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAuthToken}`,
          }),
        })
      );
    });

    test('works without authentication token', async () => {
      const adapterNoAuth = new ApiProductAdapter({
        baseUrl: mockBaseUrl,
      });

      const mockApiResponse = { data: [] };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      await adapterNoAuth.findAll();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.headers['Authorization']).toBeUndefined();
    });
  });

  describe('findById', () => {
    test('fetches a single product by ID', async () => {
      const mockApiResponse = {
        data: {
          id: 'product-1',
          name: 'Test Product',
          price: 99.99,
          originalPrice: null,
          rating: 4.5,
          reviews: 100,
          description: 'Test description',
          category: 'test-category',
          inStock: true,
          badge: null,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const productId = new ProductId('product-1');
      const product = await adapter.findById(productId);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/products/product-1`,
        expect.any(Object)
      );

      expect(product).toBeInstanceOf(Product);
      expect(product.id.value).toBe('product-1');
      expect(product.name).toBe('Test Product');
    });

    test('throws NotFoundError when API returns 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const productId = new ProductId('non-existent');

      await expect(adapter.findById(productId)).rejects.toThrow(NotFoundError);
      await expect(adapter.findById(productId)).rejects.toThrow('Resource not found: /products/non-existent');
    });
  });

  describe('findByCategory', () => {
    test('fetches products filtered by category', async () => {
      const mockApiResponse = {
        data: [
          {
            id: 'product-1',
            name: 'Test Product 1',
            price: 99.99,
            originalPrice: null,
            rating: 4.5,
            reviews: 100,
            description: 'Test description',
            category: 'survival-kits',
            inStock: true,
            badge: null,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const products = await adapter.findByCategory('survival-kits');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/products?category=survival-kits`,
        expect.any(Object)
      );

      expect(products).toHaveLength(1);
      expect(products[0].category).toBe('survival-kits');
    });
  });

  describe('search', () => {
    test('searches products with encoded query string', async () => {
      const mockApiResponse = {
        data: [
          {
            id: 'product-1',
            name: 'Emergency Kit',
            price: 99.99,
            originalPrice: null,
            rating: 4.5,
            reviews: 100,
            description: 'Emergency supplies',
            category: 'survival-kits',
            inStock: true,
            badge: null,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const products = await adapter.search('emergency kit');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/products/search?q=emergency%20kit`,
        expect.any(Object)
      );

      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Emergency Kit');
    });
  });

  describe('retry logic', () => {
    test('retries on transient failures with exponential backoff', async () => {
      const mockApiResponse = { data: [] };

      // Fail twice, then succeed
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        });

      const products = await adapter.findAll();

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(products).toEqual([]);
    });

    test('throws error after max retries exceeded', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(adapter.findAll()).rejects.toThrow('Network error');
      expect(global.fetch).toHaveBeenCalledTimes(3); // Default retries
    });

    test('does not retry on 404 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const productId = new ProductId('non-existent');

      await expect(adapter.findById(productId)).rejects.toThrow(NotFoundError);
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries for 404
    });

    test('retries on 5xx server errors', async () => {
      const mockApiResponse = { data: [] };

      // Fail with 500, then succeed
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        });

      const products = await adapter.findAll();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(products).toEqual([]);
    });
  });

  describe('error transformation', () => {
    test('transforms API errors into descriptive error messages', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(adapter.findAll()).rejects.toThrow('API error: 500 Internal Server Error');
    });

    test('handles JSON parsing errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(adapter.findAll()).rejects.toThrow('Invalid JSON');
    });
  });
});
