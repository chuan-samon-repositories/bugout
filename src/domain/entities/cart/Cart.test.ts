import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { Cart } from './Cart';
import { Product } from '../product/Product';
import { Money } from '../../value-objects/Money';
import { ProductId } from '../../value-objects/ProductId';
import { Quantity } from '../../value-objects/Quantity';
import { BusinessRuleError, NotFoundError } from '../../errors';

/**
 * Property-Based Tests for Cart Business Rules Enforcement
 * 
 * **Validates: Requirements 1.3, 7.4, 7.5**
 * 
 * Feature: hexagonal-architecture-refactor, Property 2: Cart Business Rules Enforcement
 * For any cart and any operation (add item, remove item), when the operation would violate 
 * business rules (exceed maximum quantity limit, add out-of-stock items, invalid quantities), 
 * the cart SHALL throw a BusinessRuleError and maintain its previous valid state.
 */

// Helper function to create a valid test product
function createTestProduct(overrides: Partial<{
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}> = {}): Product {
  return new Product(
    new ProductId(overrides.id || 'test-product-1'),
    overrides.name || 'Test Product',
    new Money(overrides.price || 100),
    null,
    4.5,
    100,
    'Test description',
    'test-category',
    overrides.inStock !== undefined ? overrides.inStock : true,
    null
  );
}

describe('Property 2: Cart Business Rules Enforcement', () => {
  test('Cart rejects adding items that would exceed maximum quantity limit (99)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99 }), // Initial quantity
        fc.integer({ min: 1, max: 100 }), // Additional quantity that would exceed limit
        (initialQty, additionalQty) => {
          // Only test cases where total would exceed 99
          fc.pre(initialQty + additionalQty > 99);
          
          const cart = new Cart();
          const product = createTestProduct();
          
          // Add initial quantity
          cart.addItem(product, new Quantity(initialQty));
          
          // Capture state before invalid operation
          const itemCountBefore = cart.itemCount();
          const totalBefore = cart.totalAmount().amount;
          
          // Attempt to add more items that would exceed limit
          expect(() => {
            cart.addItem(product, new Quantity(additionalQty));
          }).toThrow(BusinessRuleError);
          
          // Verify cart state is unchanged
          expect(cart.itemCount()).toBe(itemCountBefore);
          expect(cart.totalAmount().amount).toBe(totalBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Cart maintains valid state when adding items within quantity limit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Initial quantity
        fc.integer({ min: 1, max: 49 }), // Additional quantity
        (initialQty, additionalQty) => {
          // Only test cases where total is within limit
          fc.pre(initialQty + additionalQty <= 99);
          
          const cart = new Cart();
          const product = createTestProduct();
          
          // Add initial quantity
          cart.addItem(product, new Quantity(initialQty));
          
          // Add more items within limit
          cart.addItem(product, new Quantity(additionalQty));
          
          // Verify cart state is correct
          expect(cart.itemCount()).toBe(initialQty + additionalQty);
          expect(cart.totalAmount().amount).toBe((initialQty + additionalQty) * product.price.amount);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Cart throws NotFoundError when removing non-existent product', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // Product ID to add
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // Different product ID to remove
        (addId, removeId) => {
          // Ensure IDs are different
          fc.pre(addId !== removeId);
          
          const cart = new Cart();
          const product = createTestProduct({ id: addId });
          
          // Add one product
          cart.addItem(product, new Quantity(1));
          
          // Capture state before invalid operation
          const itemCountBefore = cart.itemCount();
          const totalBefore = cart.totalAmount().amount;
          
          // Attempt to remove a different product
          expect(() => {
            cart.removeItem(new ProductId(removeId));
          }).toThrow(NotFoundError);
          
          // Verify cart state is unchanged
          expect(cart.itemCount()).toBe(itemCountBefore);
          expect(cart.totalAmount().amount).toBe(totalBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Cart correctly decrements quantity when removing items', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 99 }), // Initial quantity (at least 2)
        (initialQty) => {
          const cart = new Cart();
          const product = createTestProduct();
          
          // Add items
          cart.addItem(product, new Quantity(initialQty));
          
          // Remove one item
          cart.removeItem(product.id);
          
          // Verify quantity decreased by 1
          expect(cart.itemCount()).toBe(initialQty - 1);
          expect(cart.totalAmount().amount).toBe((initialQty - 1) * product.price.amount);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Cart removes item completely when quantity reaches zero', () => {
    const cart = new Cart();
    const product = createTestProduct();
    
    // Add one item
    cart.addItem(product, new Quantity(1));
    expect(cart.itemCount()).toBe(1);
    
    // Remove the item
    cart.removeItem(product.id);
    
    // Verify cart is empty
    expect(cart.itemCount()).toBe(0);
    expect(cart.getItems().length).toBe(0);
    expect(cart.totalAmount().amount).toBe(0);
  });

  test('Cart total amount equals sum of all item subtotals', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            quantity: fc.integer({ min: 1, max: 99 })
          }),
          { minLength: 1, maxLength: 10 }
        ).map(items => {
          // Ensure unique IDs
          const uniqueItems = new Map();
          items.forEach(item => {
            if (!uniqueItems.has(item.id)) {
              uniqueItems.set(item.id, item);
            }
          });
          return Array.from(uniqueItems.values());
        }),
        (items) => {
          const cart = new Cart();
          let expectedTotal = 0;
          let expectedCount = 0;
          
          // Add all items to cart
          items.forEach(({ id, price, quantity }) => {
            const product = createTestProduct({ id, price });
            cart.addItem(product, new Quantity(quantity));
            expectedTotal += price * quantity;
            expectedCount += quantity;
          });
          
          // Verify totals match
          expect(cart.totalAmount().amount).toBeCloseTo(expectedTotal, 2);
          expect(cart.itemCount()).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Cart clear operation removes all items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            quantity: fc.integer({ min: 1, max: 10 })
          }),
          { minLength: 1, maxLength: 5 }
        ).map(items => {
          // Ensure unique IDs
          const uniqueItems = new Map();
          items.forEach(item => {
            if (!uniqueItems.has(item.id)) {
              uniqueItems.set(item.id, item);
            }
          });
          return Array.from(uniqueItems.values());
        }),
        (items) => {
          const cart = new Cart();
          
          // Add items to cart
          items.forEach(({ id, quantity }) => {
            const product = createTestProduct({ id });
            cart.addItem(product, new Quantity(quantity));
          });
          
          // Verify cart has items
          expect(cart.itemCount()).toBeGreaterThan(0);
          
          // Clear cart
          cart.clear();
          
          // Verify cart is empty
          expect(cart.itemCount()).toBe(0);
          expect(cart.getItems().length).toBe(0);
          expect(cart.totalAmount().amount).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Cart maintains state consistency across multiple operations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            operation: fc.constantFrom('add', 'remove'),
            productId: fc.constantFrom('prod-1', 'prod-2', 'prod-3'),
            quantity: fc.integer({ min: 1, max: 10 })
          }),
          { minLength: 5, maxLength: 20 }
        ),
        (operations) => {
          const cart = new Cart();
          const products = new Map([
            ['prod-1', createTestProduct({ id: 'prod-1', price: 100 })],
            ['prod-2', createTestProduct({ id: 'prod-2', price: 200 })],
            ['prod-3', createTestProduct({ id: 'prod-3', price: 300 })]
          ]);
          
          // Execute operations
          operations.forEach(({ operation, productId, quantity }) => {
            try {
              if (operation === 'add') {
                const product = products.get(productId)!;
                cart.addItem(product, new Quantity(quantity));
              } else {
                cart.removeItem(new ProductId(productId));
              }
            } catch (error) {
              console.log("Unexpected error", error)
              // Ignore expected errors (NotFoundError, BusinessRuleError)
              // These are valid business rule enforcements
            }
          });
          
          // Verify cart invariants hold
          const items = cart.getItems();
          const calculatedTotal = items.reduce((sum, item) => 
            sum + (item.product.price.amount * item.quantity.value), 0
          );
          const calculatedCount = items.reduce((sum, item) => 
            sum + item.quantity.value, 0
          );
          
          expect(cart.totalAmount().amount).toBeCloseTo(calculatedTotal, 2);
          expect(cart.itemCount()).toBe(calculatedCount);
          
          // Verify no item exceeds max quantity
          items.forEach(item => {
            expect(item.quantity.value).toBeLessThanOrEqual(99);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
