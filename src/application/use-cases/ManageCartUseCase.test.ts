import { describe, test, expect, beforeEach } from 'vitest';
import { ManageCartUseCase } from './ManageCartUseCase';
import { Cart } from '../../domain/entities/cart/Cart';
import { Product } from '../../domain/entities/product/Product';
import { ProductId } from '../../domain/value-objects/ProductId';
import { Money } from '../../domain/value-objects/Money';
import { Quantity } from '../../domain/value-objects/Quantity';
import { CartRepository } from '../ports/CartRepository';
import { ProductRepository } from '../ports/ProductRepository';
import { NotFoundError } from '../../domain/errors';

// Mock implementations
class MockCartRepository implements CartRepository {
  private cart: Cart = new Cart();

  async save(cart: Cart): Promise<void> {
    this.cart = cart;
  }

  async load(): Promise<Cart> {
    return this.cart;
  }

  async clear(): Promise<void> {
    this.cart = new Cart();
  }

  // Helper for testing
  getStoredCart(): Cart {
    return this.cart;
  }
}

class MockProductRepository implements ProductRepository {
  private products: Map<string, Product> = new Map();

  addProduct(product: Product): void {
    this.products.set(product.id.value, product);
  }

  async findAll(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async findById(id: ProductId): Promise<Product> {
    const product = this.products.get(id.value);
    if (!product) {
      throw new NotFoundError(`Product with id ${id.value} not found`);
    }
    return product;
  }

  async findByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.category === category);
  }

  async search(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    );
  }
}

// Test helper to create a product
function createTestProduct(id: string = 'test-product-1'): Product {
  return new Product(
    new ProductId(id),
    'Test Product',
    new Money(100),
    null,
    4.5,
    50,
    'Test description',
    'test-category',
    true,
    null
  );
}

describe('ManageCartUseCase', () => {
  let useCase: ManageCartUseCase;
  let cartRepository: MockCartRepository;
  let productRepository: MockProductRepository;
  let testProduct: Product;

  beforeEach(() => {
    cartRepository = new MockCartRepository();
    productRepository = new MockProductRepository();
    testProduct = createTestProduct();
    productRepository.addProduct(testProduct);
    useCase = new ManageCartUseCase(cartRepository, productRepository);
  });

  describe('addToCart', () => {
    test('adds a product to an empty cart', async () => {
      const cart = await useCase.addToCart(testProduct.id, new Quantity(2));

      expect(cart.itemCount()).toBe(2);
      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].product.id.value).toBe(testProduct.id.value);
    });

    test('adds quantity to existing product in cart', async () => {
      await useCase.addToCart(testProduct.id, new Quantity(2));
      const cart = await useCase.addToCart(testProduct.id, new Quantity(3));

      expect(cart.itemCount()).toBe(5);
      expect(cart.getItems()).toHaveLength(1);
    });

    test('persists cart after adding item', async () => {
      await useCase.addToCart(testProduct.id, new Quantity(1));

      const loadedCart = await cartRepository.load();
      expect(loadedCart.itemCount()).toBe(1);
    });

    test('throws NotFoundError when product does not exist', async () => {
      const nonExistentId = new ProductId('non-existent');

      await expect(
        useCase.addToCart(nonExistentId, new Quantity(1))
      ).rejects.toThrow(NotFoundError);
    });

    test('calculates total amount correctly', async () => {
      await useCase.addToCart(testProduct.id, new Quantity(3));

      const cart = await useCase.getCart();
      expect(cart.totalAmount().amount).toBe(300); // 3 * 100
    });
  });

  describe('removeFromCart', () => {
    test('removes one unit of a product from cart', async () => {
      await useCase.addToCart(testProduct.id, new Quantity(3));
      const cart = await useCase.removeFromCart(testProduct.id);

      expect(cart.itemCount()).toBe(2);
    });

    test('removes item entirely when quantity reaches zero', async () => {
      await useCase.addToCart(testProduct.id, new Quantity(1));
      const cart = await useCase.removeFromCart(testProduct.id);

      expect(cart.itemCount()).toBe(0);
      expect(cart.getItems()).toHaveLength(0);
    });

    test('persists cart after removing item', async () => {
      await useCase.addToCart(testProduct.id, new Quantity(2));
      await useCase.removeFromCart(testProduct.id);

      const loadedCart = await cartRepository.load();
      expect(loadedCart.itemCount()).toBe(1);
    });

    test('throws NotFoundError when product is not in cart', async () => {
      await expect(
        useCase.removeFromCart(testProduct.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('clearCart', () => {
    test('removes all items from cart', async () => {
      await useCase.addToCart(testProduct.id, new Quantity(5));
      await useCase.clearCart();

      const cart = await useCase.getCart();
      expect(cart.itemCount()).toBe(0);
      expect(cart.getItems()).toHaveLength(0);
    });

    test('clears cart with multiple products', async () => {
      const product2 = createTestProduct('test-product-2');
      productRepository.addProduct(product2);

      await useCase.addToCart(testProduct.id, new Quantity(2));
      await useCase.addToCart(product2.id, new Quantity(3));
      await useCase.clearCart();

      const cart = await useCase.getCart();
      expect(cart.itemCount()).toBe(0);
    });
  });

  describe('getCart', () => {
    test('returns empty cart when no items added', async () => {
      const cart = await useCase.getCart();

      expect(cart.itemCount()).toBe(0);
      expect(cart.getItems()).toHaveLength(0);
    });

    test('returns cart with current items', async () => {
      await useCase.addToCart(testProduct.id, new Quantity(2));

      const cart = await useCase.getCart();
      expect(cart.itemCount()).toBe(2);
      expect(cart.getItems()).toHaveLength(1);
    });
  });

  describe('integration scenarios', () => {
    test('handles multiple products in cart', async () => {
      const product2 = createTestProduct('test-product-2');
      productRepository.addProduct(product2);

      await useCase.addToCart(testProduct.id, new Quantity(2));
      await useCase.addToCart(product2.id, new Quantity(3));

      const cart = await useCase.getCart();
      expect(cart.itemCount()).toBe(5);
      expect(cart.getItems()).toHaveLength(2);
    });

    test('maintains cart state across operations', async () => {
      const product2 = createTestProduct('test-product-2');
      productRepository.addProduct(product2);

      await useCase.addToCart(testProduct.id, new Quantity(3));
      await useCase.addToCart(product2.id, new Quantity(2));
      await useCase.removeFromCart(testProduct.id);

      const cart = await useCase.getCart();
      expect(cart.itemCount()).toBe(4); // 2 from product1, 2 from product2
    });
  });
});
