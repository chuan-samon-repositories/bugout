import { KeyValueStorage, browserStorage } from '../storage';

export const SHOPIFY_CART_ID_KEY = 'bugout.shopify-cart-id';

/**
 * Remembers the visitor's Shopify cart id in localStorage. Deliberately has no
 * in-memory fallback: on the server the container is shared between visitors.
 */
export class ShopifyCartIdStore {
  constructor(
    private readonly storage?: KeyValueStorage | null,
    private readonly key: string = SHOPIFY_CART_ID_KEY,
  ) {}

  get(): string | null {
    try {
      return this.resolve()?.getItem(this.key) || null;
    } catch {
      return null;
    }
  }

  set(cartId: string): void {
    this.resolve()?.setItem(this.key, cartId);
  }

  clear(): void {
    try {
      this.resolve()?.removeItem(this.key);
    } catch {
      // Storage unavailable: nothing to forget.
    }
  }

  private resolve(): KeyValueStorage | null {
    return this.storage === undefined ? browserStorage() : this.storage;
  }
}
