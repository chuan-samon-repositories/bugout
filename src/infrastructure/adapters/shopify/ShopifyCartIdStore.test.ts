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

  it('returns the remembered checkout URL only while its cart is the stored one', () => {
    const storage = new MemoryStorage();
    const store = new ShopifyCartIdStore(storage);
    store.rememberCheckoutUrl('cart-1', 'https://shop.test/c/1');
    expect(store.checkoutUrl()).toBeNull();

    store.set('cart-1');
    expect(store.checkoutUrl()).toBe('https://shop.test/c/1');

    // Another tab switched to a new cart.
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-2');
    expect(store.checkoutUrl()).toBeNull();

    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    store.clear();
    store.set('cart-1');
    expect(store.checkoutUrl()).toBeNull();
  });

  it('remembers nothing without storage (server rendering, shared between visitors)', () => {
    const store = new ShopifyCartIdStore(null);
    store.rememberCheckoutUrl('cart-1', 'https://shop.test/c/1');
    store.set('cart-1');
    store.markChanged();
    expect(store.get()).toBeNull();
    expect(store.checkoutUrl()).toBeNull();
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
