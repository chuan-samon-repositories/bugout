import { Cart } from '@/domain/entities/cart/Cart';
import { ProductId } from '@/domain/value-objects/ProductId';
import { Quantity } from '@/domain/value-objects/Quantity';
import type { CartNotice, CartUpdate } from '@/application/dtos/Cart';
import { CartRepository } from '@/application/ports/CartRepository';
import { ProductRepository } from '@/application/ports/ProductRepository';

/** Lines the backend kept with fewer units than requested, or dropped, when it saved `requested`. */
export function backendChanges(requested: Cart, saved: Cart): CartNotice[] {
  const notices: CartNotice[] = [];
  for (const item of requested.getItems()) {
    const productId = item.product.id.value;
    const productName = item.product.displayName;
    const quantity = saved.quantityOf(item.product.id);
    if (quantity === 0) notices.push({ kind: 'removed', productId, productName });
    else if (quantity < item.quantity.value) {
      notices.push({ kind: 'quantityReduced', productId, productName, requested: item.quantity.value, quantity });
    }
  }
  return notices;
}

/**
 * Cart operations. Each one loads the cart, applies the change through the aggregate, persists it and
 * resolves to the cart the backend then holds, with notices for what the backend changed on its own
 * (lines dropped on load because they sold out, quantities lowered to the stock on save).
 */
export class ManageCartUseCase {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  /** When the load dropped lines, the cart is saved so they are removed from the backend and reported once. */
  async getCart(): Promise<CartUpdate> {
    const cart = await this.cartRepository.load();
    const notices = this.cartRepository.loadNotices();
    if (notices.length === 0) return { cart, notices };
    try {
      return { cart: await this.cartRepository.save(cart), notices };
    } catch {
      // Best effort: the next change removes the lines instead.
      return { cart, notices };
    }
  }

  /** Looks the product up first so the cart always uses the current price and stock. */
  async addToCart(productId: ProductId, quantity: Quantity): Promise<CartUpdate> {
    const product = await this.productRepository.findById(productId);
    return this.update((cart) => cart.addItem(product, quantity));
  }

  setQuantity(productId: ProductId, quantity: Quantity): Promise<CartUpdate> {
    return this.update((cart) => cart.setQuantity(productId, quantity));
  }

  /** Removes the whole line. */
  deleteFromCart(productId: ProductId): Promise<CartUpdate> {
    return this.update((cart) => cart.deleteItem(productId));
  }

  async clearCart(): Promise<CartUpdate> {
    await this.cartRepository.clear();
    return { cart: await this.cartRepository.load(), notices: [] };
  }

  private async update(change: (cart: Cart) => void): Promise<CartUpdate> {
    const cart = await this.cartRepository.load();
    const dropped = this.cartRepository.loadNotices();
    change(cart);
    const saved = await this.cartRepository.save(cart);
    return { cart: saved, notices: [...dropped, ...backendChanges(cart, saved)] };
  }
}
