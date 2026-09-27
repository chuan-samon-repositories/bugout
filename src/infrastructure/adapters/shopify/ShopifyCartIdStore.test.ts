import { describe, expect, it } from 'vitest';
import { SHOPIFY_CART_ID_KEY, SHOPIFY_CART_REVISION_KEY, ShopifyCartIdStore } from './ShopifyCartIdStore';
import { MemoryStorage } from '@/infrastructure/testing/MemoryStorage';

describe('ShopifyCartIdStore', () => {
  it('stores and forgets the cart id', () => {
    const storage = new MemoryStorage();
    const store = new ShopifyCartIdStore(storage);
    store.set('cart-1');
    expect(storage.getItem(SHOPIFY_CART_ID_KEY)).toBe('cart-1');
    expect(store.get()).toBe('cart-1');
    store.clear();
    expect(store.get()).toBeNull();
  });

  it('remembers nothing without storage (server rendering, shared between visitors)', () => {
    const store = new ShopifyCartIdStore(null);
    store.set('cart-1');
    store.markChanged();
    expect(store.get()).toBeNull();
  });

  it('writes a new revision on every change, even within the same millisecond', () => {
    const storage = new MemoryStorage();
    const store = new ShopifyCartIdStore(storage);
    store.markChanged(1000);
    expect(storage.getItem(SHOPIFY_CART_REVISION_KEY)).toBe('1000');
    store.markChanged(1000);
    expect(storage.getItem(SHOPIFY_CART_REVISION_KEY)).toBe('1001');
    store.markChanged(5000);
    expect(storage.getItem(SHOPIFY_CART_REVISION_KEY)).toBe('5000');
  });

  it('never throws when storage refuses the revision', () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(() => new ShopifyCartIdStore(storage).markChanged()).not.toThrow();
  });
});
