import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageCartAdapter } from './LocalStorageCartAdapter';
import { Cart } from '../../domain/entities/cart/Cart';
import { Product } from '../../domain/entities/product/Product';
import { Money } from '../../domain/value-objects/Money';
import { ProductId } from '../../domain/value-objects/ProductId';
import { Quantity } from '../../domain/value-objects/Quantity';

describe('LocalStorageCartAdapter', () => {
  let adapter: LocalStorageCartAdapter;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    
    global.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    } as Storage;

    adapter = new LocalStorageCartAdapter();
  });

  describe('save and load', () => {
    it('should save and load a cart with items', async () => {
      // Create a cart with items
      const cart = new Cart();
      const product = new Product(
        new ProductId('test-product'),
        'Test Product',
        new Money(100),
        null,
        4.5,
        10,
        'A test product',
        'test-category',
        true,
        null
      );
      
      cart.addItem(product, new Quantity(2));

      // Save the cart
      await adapter.save(cart);

      // Load the cart
      const loadedCart = await adapter.load();

      // Verify the cart was loaded correctly
      expect(loadedCart.itemCount()).toBe(2);
      expect(loadedCart.totalAmount().amount).toBe(200);
      
      const items = loadedCart.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].product.id.value).toBe('test-product');
      expect(items[0].product.name).toBe('Test Product');
      expect(items[0].quantity.value).toBe(2);
    });

    it('should save and load a cart with multiple products', async () => {
      const cart = new Cart();
      
      const product1 = new Product(
        new ProductId('product-1'),
        'Product 1',
        new Money(50),
        new Money(75),
        4.0,
        5,
        'First product',
        'category-1',
        true,
        'BESTSELLER'
      );
      
      const product2 = new Product(
        new ProductId('product-2'),
        'Product 2',
        new Money(30),
        null,
        3.5,
        8,
        'Second product',
        'category-2',
        true,
        null
      );

      cart.addItem(product1, new Quantity(1));
      cart.addItem(product2, new Quantity(3));

      await adapter.save(cart);
      const loadedCart = await adapter.load();

      expect(loadedCart.itemCount()).toBe(4);
      expect(loadedCart.totalAmount().amount).toBe(140); // 50 + (30 * 3)
      
      const items = loadedCart.getItems();
      expect(items).toHaveLength(2);
    });

    it('should preserve product properties including originalPrice and badge', async () => {
      const cart = new Cart();
      const product = new Product(
        new ProductId('sale-product'),
        'Sale Product',
        new Money(80),
        new Money(100),
        4.8,
        20,
        'A product on sale',
        'sale-category',
        true,
        'PREMIUM'
      );

      cart.addItem(product, new Quantity(1));
      await adapter.save(cart);
      const loadedCart = await adapter.load();

      const items = loadedCart.getItems();
      expect(items[0].product.originalPrice?.amount).toBe(100);
      expect(items[0].product.badge).toBe('PREMIUM');
      expect(items[0].product.isOnSale()).toBe(true);
    });
  });

  describe('load', () => {
    it('should return an empty cart when no data exists', async () => {
      const cart = await adapter.load();
      
      expect(cart.itemCount()).toBe(0);
      expect(cart.getItems()).toHaveLength(0);
    });

    it('should return an empty cart when localStorage data is corrupted', async () => {
      mockLocalStorage['shopping-cart'] = 'invalid json {{{';
      
      const cart = await adapter.load();
      
      expect(cart.itemCount()).toBe(0);
      expect(cart.getItems()).toHaveLength(0);
    });

    it('should skip invalid items but load valid ones', async () => {
      const validProduct = {
        id: 'valid-product',
        name: 'Valid Product',
        price: 50,
        originalPrice: null,
        rating: 4.0,
        reviews: 10,
        description: 'Valid',
        category: 'test',
        inStock: true,
        badge: null,
      };

      const invalidProduct = {
        id: 'invalid-product',
        name: 'Invalid Product',
        price: -10, // Invalid: negative price
        originalPrice: null,
        rating: 4.0,
        reviews: 10,
        description: 'Invalid',
        category: 'test',
        inStock: true,
        badge: null,
      };

      mockLocalStorage['shopping-cart'] = JSON.stringify({
        items: [
          { product: validProduct, quantity: 1 },
          { product: invalidProduct, quantity: 1 },
        ],
      });

      const cart = await adapter.load();
      
      // Should only load the valid product
      expect(cart.itemCount()).toBe(1);
      expect(cart.getItems()[0].product.id.value).toBe('valid-product');
    });
  });

  describe('clear', () => {
    it('should remove cart data from localStorage', async () => {
      const cart = new Cart();
      const product = new Product(
        new ProductId('test-product'),
        'Test Product',
        new Money(100),
        null,
        4.5,
        10,
        'A test product',
        'test-category',
        true,
        null
      );
      
      cart.addItem(product, new Quantity(1));
      await adapter.save(cart);

      // Verify cart was saved
      expect(mockLocalStorage['shopping-cart']).toBeDefined();

      // Clear the cart
      await adapter.clear();

      // Verify cart was removed
      expect(mockLocalStorage['shopping-cart']).toBeUndefined();
      
      // Loading should return empty cart
      const loadedCart = await adapter.load();
      expect(loadedCart.itemCount()).toBe(0);
    });
  });
});
