import { Money } from '../../value-objects/Money';
import { Quantity } from '../../value-objects/Quantity';
import { Product } from '../product/Product';

/**
 * Immutable product-quantity pair inside a Cart.
 * Quantity changes go through the Cart aggregate, which returns new items.
 */
export class CartItem {
  constructor(
    public readonly product: Product,
    public readonly quantity: Quantity,
  ) {}

  withQuantity(quantity: Quantity): CartItem {
    return new CartItem(this.product, quantity);
  }

  subtotal(): Money {
    return this.product.price.multiply(this.quantity.value);
  }
}
