import { Money } from '../../value-objects/Money';
import { Quantity } from '../../value-objects/Quantity';
import { Product } from '../product/Product';

/**
 * CartItem entity representing a product-quantity pair in a shopping cart.
 */
export class CartItem {
  constructor(
    public readonly product: Product,
    public quantity: Quantity
  ) {}

  updateQuantity(newQuantity: Quantity): void {
    this.quantity = newQuantity;
  }

  subtotal(): Money {
    return this.product.price.multiply(this.quantity.value);
  }
}
