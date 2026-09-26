import { Cart } from '@/domain/entities/cart/Cart';
import { ProductId } from '@/domain/value-objects/ProductId';
import { Quantity } from '@/domain/value-objects/Quantity';
import { CartRepository } from '../ports/CartRepository';
import { ProductRepository } from '../ports/ProductRepository';

/** Cart operations. Each one loads the cart, applies the change through the aggregate, persists it and resolves to the updated Cart. */
export class ManageCartUseCase {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  getCart(): Promise<Cart> {
    return this.cartRepository.load();
  }

  /** Looks the product up first so the cart always uses the current price and stock. */
  async addToCart(productId: ProductId, quantity: Quantity): Promise<Cart> {
    const product = await this.productRepository.findById(productId);
    return this.update((cart) => cart.addItem(product, quantity));
  }

  setQuantity(productId: ProductId, quantity: Quantity): Promise<Cart> {
    return this.update((cart) => cart.setQuantity(productId, quantity));
  }

  /** Removes a single unit. */
  removeFromCart(productId: ProductId): Promise<Cart> {
    return this.update((cart) => cart.removeItem(productId));
  }

  /** Removes the whole line. */
  deleteFromCart(productId: ProductId): Promise<Cart> {
    return this.update((cart) => cart.deleteItem(productId));
  }

  async clearCart(): Promise<Cart> {
    await this.cartRepository.clear();
    return this.cartRepository.load();
  }

  private async update(change: (cart: Cart) => void): Promise<Cart> {
    const cart = await this.cartRepository.load();
    change(cart);
    await this.cartRepository.save(cart);
    return cart;
  }
}
