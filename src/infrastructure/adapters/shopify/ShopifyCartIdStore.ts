import { KeyValueStorage, browserStorage } from '@/infrastructure/adapters/storage';

export const SHOPIFY_CART_ID_KEY = 'bugout.shopify-cart-id';
/**
 * Bumped (to `Date.now()`) after every successful cart mutation. Line changes keep the
 * same cart id, so other tabs listen for this key to know they must reload the cart.
 */
export const SHOPIFY_CART_REVISION_KEY = 'bugout.shopify-cart-rev';

interface KnownCheckout {
  cartId: string;
  checkoutUrl: string;
}

/**
 * Remembers the visitor's Shopify cart id in localStorage. Deliberately has no
 * in-memory fallback for the id: on the server the container is shared between
 * visitors. The checkout URL of the last loaded or mutated cart is kept in memory
 * (browser only) and is returned only while that cart is still the stored one.
 */
export class ShopifyCartIdStore {
  private knownCheckout: KnownCheckout | null = null;

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
    this.knownCheckout = null;
    try {
      this.resolve()?.removeItem(this.key);
    } catch {
      // Storage unavailable: nothing to forget.
    }
  }

  /** Remembers the checkout URL Shopify returned for `cartId`. Ignored without storage (server). */
  rememberCheckoutUrl(cartId: string, checkoutUrl: string): void {
    if (!this.hasStorage()) return;
    this.knownCheckout = { cartId, checkoutUrl };
  }

  /** The remembered checkout URL, only when it belongs to the currently stored cart id. */
  checkoutUrl(): string | null {
    const cartId = this.get();
    return cartId && this.knownCheckout?.cartId === cartId ? this.knownCheckout.checkoutUrl : null;
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
