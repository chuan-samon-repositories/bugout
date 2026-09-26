import { BusinessRuleError, NotFoundError } from '../../errors';
import { CurrencyCode, Money } from '../../value-objects/Money';
import { ProductId } from '../../value-objects/ProductId';
import { Quantity } from '../../value-objects/Quantity';
import { CartItem } from './CartItem';
import { Product } from '../product/Product';

export const MAX_QUANTITY_PER_ITEM = 99;

/**
 * Cart aggregate root. All quantity changes go through it so the
 * per-item limit, stock rule and single-currency rule always hold.
 */
export class Cart {
  private readonly items = new Map<string, CartItem>();

  constructor(public readonly currency: CurrencyCode) {}

  addItem(product: Product, quantity: Quantity): void {
    if (!product.inStock) {
      throw new BusinessRuleError('OUT_OF_STOCK', `${product.name} is out of stock`);
    }
    if (product.price.currency !== this.currency) {
      throw new BusinessRuleError(
        'CURRENCY_MISMATCH',
        `Cart uses ${this.currency} but ${product.name} is priced in ${product.price.currency}`,
      );
    }
    const current = this.quantityOf(product.id);
    this.put(product, current + quantity.value);
  }

  /** Sets the exact quantity of a product already in the cart. */
  setQuantity(productId: ProductId, quantity: Quantity): void {
    const item = this.requireItem(productId);
    this.put(item.product, quantity.value);
  }

  /** Removes one unit; drops the line when it reaches zero. */
  removeItem(productId: ProductId): void {
    const item = this.requireItem(productId);
    if (item.quantity.value > 1) {
      this.items.set(productId.value, item.withQuantity(new Quantity(item.quantity.value - 1)));
    } else {
      this.items.delete(productId.value);
    }
  }

  /** Removes the whole line regardless of quantity. */
  deleteItem(productId: ProductId): void {
    this.requireItem(productId);
    this.items.delete(productId.value);
  }

  clear(): void {
    this.items.clear();
  }

  getItems(): readonly CartItem[] {
    return Array.from(this.items.values());
  }

  quantityOf(productId: ProductId): number {
    return this.items.get(productId.value)?.quantity.value ?? 0;
  }

  isEmpty(): boolean {
    return this.items.size === 0;
  }

  totalAmount(): Money {
    return this.getItems().reduce((total, item) => total.add(item.subtotal()), Money.zero(this.currency));
  }

  itemCount(): number {
    return this.getItems().reduce((count, item) => count + item.quantity.value, 0);
  }

  private put(product: Product, quantity: number): void {
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      throw new BusinessRuleError(
        'MAX_QUANTITY_EXCEEDED',
        `Cannot have more than ${MAX_QUANTITY_PER_ITEM} units of ${product.name}`,
      );
    }
    this.items.set(product.id.value, new CartItem(product, new Quantity(quantity)));
  }

  private requireItem(productId: ProductId): CartItem {
    const item = this.items.get(productId.value);
    if (!item) {
      throw new NotFoundError(`Product ${productId.value} not in cart`);
    }
    return item;
  }
}
