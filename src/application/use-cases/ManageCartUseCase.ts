import { Cart } from '../../domain/entities/cart/Cart';
import { ProductId } from '../../domain/value-objects/ProductId';
import { Quantity } from '../../domain/value-objects/Quantity';
import { CartRepository } from '../ports/CartRepository';
import { ProductRepository } from '../ports/ProductRepository';

/**
 * Use case for managing shopping cart operations.
 * Orchestrates cart operations by coordinating between CartRepository and ProductRepository.
 * 
 * This use case:
 * - Validates products exist before adding to cart
 * - Delegates business rule enforcement to Cart entity
 * - Persists cart state after each operation
 * - Provides a clean interface for cart management
 * 
 * Requirements: 2.4, 2.5, 7.1
 */
export class ManageCartUseCase {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository
  ) {}

  /**
   * Adds a product to the cart with the specified quantity.
   * Validates that the product exists before adding.
   * 
   * @param productId - The ID of the product to add
   * @param quantity - The quantity to add
   * @returns Promise resolving to the updated Cart
   * @throws NotFoundError if product doesn't exist
   * @throws BusinessRuleError if adding would violate cart rules (e.g., max quantity)
   */
  async addToCart(productId: ProductId, quantity: Quantity): Promise<Cart> {
    const product = await this.productRepository.findById(productId);
    const cart = await this.cartRepository.load();
    
    cart.addItem(product, quantity);
    await this.cartRepository.save(cart);
    
    return cart;
  }

  /**
   * Removes one unit of a product from the cart.
   * If the product quantity becomes zero, removes the item entirely.
   * 
   * @param productId - The ID of the product to remove
   * @returns Promise resolving to the updated Cart
   * @throws NotFoundError if product is not in the cart
   */
  async removeFromCart(productId: ProductId): Promise<Cart> {
    const cart = await this.cartRepository.load();
    cart.removeItem(productId);
    await this.cartRepository.save(cart);
    return cart;
  }

  /**
   * Clears all items from the cart.
   * 
   * @returns Promise resolving when the cart is cleared
   */
  async clearCart(): Promise<void> {
    await this.cartRepository.clear();
  }

  /**
   * Retrieves the current cart state.
   * 
   * @returns Promise resolving to the current Cart
   */
  async getCart(): Promise<Cart> {
    return await this.cartRepository.load();
  }
}
