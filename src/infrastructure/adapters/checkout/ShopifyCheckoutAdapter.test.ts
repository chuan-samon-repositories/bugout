import { beforeEach, describe, expect, it } from 'vitest';
import { ShopifyCheckoutAdapter } from './ShopifyCheckoutAdapter';
import { LocalCheckoutAdapter } from './LocalCheckoutAdapter';
import { ShopifyCartIdStore, SHOPIFY_CART_ID_KEY } from '../shopify/ShopifyCartIdStore';
import { mapShopifyProduct } from '../shopify/productMapping';
import { MemoryStorage } from '../../testing/MemoryStorage';
import { cartNode, mutationResult, productNode, queuedFetch, sentRequest, testClient, variantGid, variantNode } from '../../testing/shopifyFixtures';
import { Cart } from '@/domain/entities/cart/Cart';
import { Quantity } from '@/domain/value-objects/Quantity';

function cartWithOneItem(): Cart {
  const cart = new Cart('EUR');
  cart.addItem(mapShopifyProduct(productNode(), variantNode(1)), new Quantity(2));
  return cart;
}

describe('ShopifyCheckoutAdapter', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  const adapterWith = (fetch: ReturnType<typeof queuedFetch>) =>
    new ShopifyCheckoutAdapter(testClient(fetch), new ShopifyCartIdStore(storage));

  it('returns the checkout URL of the stored cart', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const fetch = queuedFetch({ data: { cart: { checkoutUrl: 'https://shop.test/checkouts/cart-1' } } });
    await expect(adapterWith(fetch).getCheckoutUrl(cartWithOneItem())).resolves.toBe('https://shop.test/checkouts/cart-1');
    expect(sentRequest(fetch, 0).variables).toEqual({ id: 'cart-1' });
  });

  it('creates the cart from the aggregate when there is no id', async () => {
    const created = cartNode('cart-new', [{ lineId: 'l1', variant: 1, quantity: 2 }]);
    const fetch = queuedFetch(mutationResult('cartCreate', created));
    const url = await adapterWith(fetch).getCheckoutUrl(cartWithOneItem());
    expect(url).toBe(created.checkoutUrl);
    expect(sentRequest(fetch, 0).variables).toEqual({ lines: [{ merchandiseId: variantGid(1), quantity: 2 }] });
    expect(storage.getItem(SHOPIFY_CART_ID_KEY)).toBe('cart-new');
  });

  it('recreates the cart when the stored one has expired', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'expired');
    const created = cartNode('cart-new');
    const fetch = queuedFetch({ data: { cart: null } }, mutationResult('cartCreate', created));
    await expect(adapterWith(fetch).getCheckoutUrl(cartWithOneItem())).resolves.toBe(created.checkoutUrl);
    expect(storage.getItem(SHOPIFY_CART_ID_KEY)).toBe('cart-new');
  });

  it('throws on user errors', async () => {
    const fetch = queuedFetch(mutationResult('cartCreate', null, [{ message: 'Invalid merchandise' }]));
    await expect(adapterWith(fetch).getCheckoutUrl(cartWithOneItem())).rejects.toThrow('cartCreate failed: Invalid merchandise');
  });
});

describe('LocalCheckoutAdapter', () => {
  it('points to the in-app checkout', async () => {
    await expect(new LocalCheckoutAdapter().getCheckoutUrl()).resolves.toBe('/checkout');
  });
});
