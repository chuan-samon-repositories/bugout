import type { CartNotice } from '@/application/dtos/Cart';
import { Cart } from '@/domain/entities/cart/Cart';

/**
 * Persistence for the shopper's cart. Implementations must return a fresh
 * empty Cart (never throw) when nothing is stored or stored data is unusable,
 * and must re-price items from the catalog rather than trusting stored prices.
 */
export interface CartRepository {
  /** Lines that can no longer be sold are left out and reported by `loadNotices()`. */
  load(): Promise<Cart>;
  /**
   * Persists `cart` and resolves to what the backend now holds. That can have fewer
   * units or lines than `cart` (Shopify lowers quantities to the stock available and
   * drops sold-out lines); ManageCartUseCase reports the difference as CartNotices.
   */
  save(cart: Cart): Promise<Cart>;
  clear(): Promise<void>;
  /** `removed` notices for the lines the most recent `load()` left out; each load replaces them. */
  loadNotices(): readonly CartNotice[];
}
