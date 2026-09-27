import { KeyValueStorage, browserStorage } from '@/infrastructure/adapters/storage';

export const SHOPIFY_CART_ID_KEY = 'bugout.shopify-cart-id';
/**
 * Bumped (to `Date.now()`) after every successful cart mutation. Line changes keep the
 * same cart id, so other tabs listen for this key to know they must reload the cart.
 */
export const SHOPIFY_CART_REVISION_KEY = 'bugout.shopify-cart-rev';

/**
 * Remembers the visitor's Shopify cart id in localStorage. Deliberately has no
 * in-memory fallback for the id: on the server the container is shared between
 * visitors.
 */
export class ShopifyCartIdStore {
  constructor(
    private readonly storage?: KeyValueStorage | null,
    private readonly key: string = SHOPIFY_CART_ID_KEY,
    private readonly revisionKey: string = SHOPIFY_CART_REVISION_KEY,
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

  /**
   * Tells other tabs the remote cart lines changed by writing a new revision. A
   * `storage` event only fires when the value changes, so two saves within the same
   * millisecond still get distinct revisions. Never throws.
   */
  markChanged(now: number = Date.now()): void {
    try {
      const storage = this.resolve();
      if (!storage) return;
      const previous = Number(storage.getItem(this.revisionKey));
      const revision = Number.isFinite(previous) && previous >= now ? previous + 1 : now;
      storage.setItem(this.revisionKey, String(revision));
    } catch {
      // Storage unavailable or full: other tabs just miss this update.
    }
  }

  private hasStorage(): boolean {
    try {
      return this.resolve() !== null;
    } catch {
      return false;
    }
  }

  private resolve(): KeyValueStorage | null {
    return this.storage === undefined ? browserStorage() : this.storage;
  }
}
