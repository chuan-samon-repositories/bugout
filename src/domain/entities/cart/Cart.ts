import { BusinessRuleError, NotFoundError } from '../../errors';
import { Money } from '../../value-objects/Money';
import { ProductId } from '../../value-objects/ProductId';
import { Quantity } from '../../value-objects/Quantity';
import { CartItem } from './CartItem';
import { Product } from '../product/Product';

/**
 * Cart entity (aggregate root) managing shopping cart items.
 * Enforces business rules for item quantity limits, total calculations, and cart validation.
 */
export class Cart {
  private items: Map<string, CartItem> = new Map();
  private readonly maxQuantityPerItem = 99;

  addItem(product: Product, quantity: Quantity): void {
    const existingItem = this.items.get(product.id.value);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity.add(quantity);
      if (newQuantity.value > this.maxQuantityPerItem) {
        throw new BusinessRuleError(`Cannot exceed ${this.maxQuantityPerItem} items`);
      }
      existingItem.updateQuantity(newQuantity);
    } else {
      this.items.set(product.id.value, new CartItem(product, quantity));
    }
  }

  removeItem(productId: ProductId): void {
    const item = this.items.get(productId.value);
    if (!item) {
      throw new NotFoundError(`Product ${productId.value} not in cart`);
    }

    if (item.quantity.value > 1) {
      item.updateQuantity(new Quantity(item.quantity.value - 1));
    } else {
      this.items.delete(productId.value);
    }
  }

  deleteItem(productId: ProductId): void {
    if (!this.items.has(productId.value)) {
      throw new NotFoundError(`Product ${productId.value} not in cart`);
    }
    this.items.delete(productId.value);
  }

  clear(): void {
    this.items.clear();
  }

  getItems(): CartItem[] {
    return Array.from(this.items.values());
  }

  totalAmount(): Money {
    return this.getItems().reduce(
      (total, item) => total.add(item.subtotal()),
      new Money(0)
    );
  }

  itemCount(): number {
    return this.getItems().reduce((count, item) => count + item.quantity.value, 0);
  }
}
