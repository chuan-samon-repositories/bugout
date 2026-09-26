import { Cart } from '@/domain/entities/cart/Cart';

/**
 * Persistence for the shopper's cart. Implementations must return a fresh
 * empty Cart (never throw) when nothing is stored or stored data is unusable,
 * and must re-price items from the catalog rather than trusting stored prices.
 */
export interface CartRepository {
  load(): Promise<Cart>;
  save(cart: Cart): Promise<void>;
  clear(): Promise<void>;
}
