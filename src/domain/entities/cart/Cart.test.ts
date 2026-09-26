import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { Cart, MAX_QUANTITY_PER_ITEM } from './Cart';
import { buildProduct } from '@/domain/testing/buildProduct';
import { ProductId } from '@/domain/value-objects/ProductId';
import { Quantity } from '@/domain/value-objects/Quantity';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';

const qty = (value: number) => new Quantity(value);

function expectRule(action: () => void, code: BusinessRuleError['code']): void {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(BusinessRuleError);
    expect((error as BusinessRuleError).code).toBe(code);
    return;
  }
  throw new Error(`Expected BusinessRuleError ${code}`);
}

describe('Cart', () => {
  it('starts empty', () => {
    const cart = new Cart('EUR');
    expect(cart.isEmpty()).toBe(true);
    expect(cart.itemCount()).toBe(0);
    expect(cart.totalAmount().minor).toBe(0);
    expect(cart.totalAmount().currency).toBe('EUR');
  });

  it('enforces the per-item limit on the first add', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 500 }), (quantity) => {
        const cart = new Cart('EUR');
        const product = buildProduct();
        if (quantity > MAX_QUANTITY_PER_ITEM) {
          expectRule(() => cart.addItem(product, qty(quantity)), 'MAX_QUANTITY_EXCEEDED');
          expect(cart.isEmpty()).toBe(true);
        } else {
          cart.addItem(product, qty(quantity));
          expect(cart.quantityOf(product.id)).toBe(quantity);
        }
      }),
    );
  });

  it('enforces the per-item limit when merging into an existing line', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: MAX_QUANTITY_PER_ITEM }),
        fc.integer({ min: 1, max: MAX_QUANTITY_PER_ITEM }),
        (first, second) => {
          const cart = new Cart('EUR');
          const product = buildProduct();
          cart.addItem(product, qty(first));
          if (first + second > MAX_QUANTITY_PER_ITEM) {
            expectRule(() => cart.addItem(product, qty(second)), 'MAX_QUANTITY_EXCEEDED');
            expect(cart.quantityOf(product.id)).toBe(first);
          } else {
            cart.addItem(product, qty(second));
            expect(cart.quantityOf(product.id)).toBe(first + second);
          }
          expect(cart.getItems()).toHaveLength(1);
        },
      ),
    );
  });

  it('enforces the per-item limit on setQuantity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 500 }), (quantity) => {
        const cart = new Cart('EUR');
        const product = buildProduct();
        cart.addItem(product, qty(5));
        if (quantity > MAX_QUANTITY_PER_ITEM) {
          expectRule(() => cart.setQuantity(product.id, qty(quantity)), 'MAX_QUANTITY_EXCEEDED');
          expect(cart.quantityOf(product.id)).toBe(5);
        } else {
          cart.setQuantity(product.id, qty(quantity));
          expect(cart.quantityOf(product.id)).toBe(quantity);
        }
      }),
    );
  });

  it('throws NotFoundError when setting the quantity of a missing product', () => {
    expect(() => new Cart('EUR').setQuantity(new ProductId('missing'), qty(1))).toThrow(NotFoundError);
  });

  it('rejects out-of-stock products', () => {
    const cart = new Cart('EUR');
    expectRule(() => cart.addItem(buildProduct({ inStock: false }), qty(1)), 'OUT_OF_STOCK');
    expect(cart.isEmpty()).toBe(true);
  });

  it('rejects products priced in another currency', () => {
    const cart = new Cart('EUR');
    expectRule(() => cart.addItem(buildProduct({ currency: 'USD' }), qty(1)), 'CURRENCY_MISMATCH');
    expect(cart.isEmpty()).toBe(true);
  });

  it('computes exact totals and item counts', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ cents: fc.integer({ min: 1, max: 100_000 }), quantity: fc.integer({ min: 1, max: 99 }) }),
          { maxLength: 20 },
        ),
        (lines) => {
          const cart = new Cart('EUR');
          lines.forEach((line, index) => {
            cart.addItem(buildProduct({ id: `p-${index}`, price: line.cents / 100 }), qty(line.quantity));
          });
          const expectedTotal = lines.reduce((sum, line) => sum + line.cents * line.quantity, 0);
          const expectedCount = lines.reduce((sum, line) => sum + line.quantity, 0);
          expect(cart.totalAmount().minor).toBe(expectedTotal);
          expect(cart.itemCount()).toBe(expectedCount);
        },
      ),
    );
  });

  it('adds 0.10 € and 0.20 € to exactly 0.30 €', () => {
    const cart = new Cart('EUR');
    cart.addItem(buildProduct({ id: 'a', price: 0.1 }), qty(1));
    cart.addItem(buildProduct({ id: 'b', price: 0.2 }), qty(1));
    expect(cart.totalAmount().minor).toBe(30);
  });

  it('replaces the stored product with the latest one on add', () => {
    const cart = new Cart('EUR');
    cart.addItem(buildProduct({ price: 100 }), qty(1));
    cart.addItem(buildProduct({ price: 80 }), qty(1));
    expect(cart.totalAmount().minor).toBe(16000);
  });

  it('deleteItem removes the whole line', () => {
    const cart = new Cart('EUR');
    const keep = buildProduct({ id: 'keep' });
    const drop = buildProduct({ id: 'drop' });
    cart.addItem(keep, qty(1));
    cart.addItem(drop, qty(7));
    cart.deleteItem(drop.id);
    expect(cart.getItems().map((item) => item.product.id.value)).toEqual(['keep']);
    expect(() => cart.deleteItem(drop.id)).toThrow(NotFoundError);
  });

  it('clear empties the cart', () => {
    const cart = new Cart('EUR');
    cart.addItem(buildProduct(), qty(3));
    cart.clear();
    expect(cart.isEmpty()).toBe(true);
  });

  it('does not let getItems() be used to mutate the cart', () => {
    const cart = new Cart('EUR');
    const product = buildProduct();
    cart.addItem(product, qty(2));

    const items = cart.getItems() as unknown as unknown[];
    items.pop();
    items.push(items[0]);
    expect(cart.getItems()).toHaveLength(1);

  });

  it('replaces an item instead of changing it when its quantity changes', () => {
    const cart = new Cart('EUR');
    const product = buildProduct();
    cart.addItem(product, qty(2));
    const [item] = cart.getItems();

    cart.setQuantity(product.id, qty(5));

    expect(item.quantity.value).toBe(2);
    expect(cart.getItems()[0]).not.toBe(item);
    expect(cart.quantityOf(product.id)).toBe(5);
  });

  it('keeps insertion order of lines', () => {
    const cart = new Cart('EUR');
    ['c', 'a', 'b'].forEach((id) => cart.addItem(buildProduct({ id }), qty(1)));
    expect(cart.getItems().map((item) => item.product.id.value)).toEqual(['c', 'a', 'b']);
  });
});
