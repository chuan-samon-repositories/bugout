import { Product } from '@/domain/entities/product/Product';
import { Money } from '@/domain/value-objects/Money';
import { Quantity } from '@/domain/value-objects/Quantity';

/**
 * Immutable product-quantity line inside a Cart. Items are never changed in place:
 * the Cart aggregate replaces an item with a new one whenever its quantity changes.
 */
export class CartItem {
  constructor(
    public readonly product: Product,
    public readonly quantity: Quantity,
  ) {}

  subtotal(): Money {
    return this.product.price.multiply(this.quantity.value);
  }
}
