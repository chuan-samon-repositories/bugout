import { Cart } from '../../domain/entities/cart/Cart';

/**
 * Port interface defining the contract for cart persistence operations.
 * This interface decouples the application layer from infrastructure implementations,
 * allowing different storage adapters (localStorage, sessionStorage, API, etc.) to be swapped
 * without modifying business logic.
 * 
 * Implementations must handle:
 * - Cart serialization and deserialization
 * - Persistence to storage medium
 * - Error handling for storage failures
 * - Recovery from corrupted or invalid data
 */
export interface CartRepository {
  /**
   * Persists the cart to the storage medium.
   * @param cart - The Cart entity to save
   * @returns Promise resolving when save operation completes
   * @throws Error if storage is unavailable or save operation fails
   */
  save(cart: Cart): Promise<void>;

  /**
   * Loads the cart from the storage medium.
   * If no cart exists or data is corrupted, returns a new empty Cart.
   * @returns Promise resolving to the Cart entity
   * @throws Error if storage is unavailable (but not if cart doesn't exist)
   */
  load(): Promise<Cart>;

  /**
   * Removes the cart from the storage medium.
   * @returns Promise resolving when clear operation completes
   * @throws Error if storage is unavailable
   */
  clear(): Promise<void>;
}
