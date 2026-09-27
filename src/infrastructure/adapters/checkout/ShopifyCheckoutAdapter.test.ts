import { beforeEach, describe, expect, it } from 'vitest';
import { ShopifyCheckoutAdapter } from './ShopifyCheckoutAdapter';
import { CheckoutContext, DEFAULT_CHECKOUT_CONTEXT } from '@/application/dtos/Checkout';
import { LocalCheckoutAdapter } from '@/infrastructure/adapters/checkout/LocalCheckoutAdapter';
import { ShopifyCartIdStore, SHOPIFY_CART_ID_KEY } from '@/infrastructure/adapters/shopify/ShopifyCartIdStore';
import { mapShopifyProduct } from '@/infrastructure/adapters/shopify/productMapping';
import { MemoryStorage } from '@/infrastructure/testing/MemoryStorage';
import {
  mutationResult,
  productNode,
  queuedFetch,
  sentRequest,
  testClient,
  variantGid,
  variantNode,
} from '@/infrastructure/testing/shopifyFixtures';
import { Cart } from '@/domain/entities/cart/Cart';
import { Quantity } from '@/domain/value-objects/Quantity';

function cartWithOneItem(): Cart {
  const cart = new Cart('EUR');
  cart.addItem(mapShopifyProduct(productNode(), variantNode(1)), new Quantity(2));
  return cart;
}

const checkoutCart = (id: string) => ({ id, checkoutUrl: `https://shop.test/checkouts/${id}?_cs=abc` });

const consented: CheckoutContext = {
  analyticsConsent: true,
  attribution: { distinctId: 'visitor-1', sessionId: 'session-1', campaign: { utm_source: 'google', gclid: 'Cj0K' } },
};

describe('ShopifyCheckoutAdapter', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  const adapterWith = (fetch: ReturnType<typeof queuedFetch>) =>
    new ShopifyCheckoutAdapter(testClient(fetch), new ShopifyCartIdStore(storage));

  it('writes the attribution onto the stored cart and returns its checkout URL in the consent context', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const fetch = queuedFetch(mutationResult('cartAttributesUpdate', checkoutCart('cart-1') as never));
    await expect(adapterWith(fetch).getCheckoutUrl(cartWithOneItem(), consented)).resolves.toBe(
      'https://shop.test/checkouts/cart-1?_cs=abc',
    );
    const request = sentRequest(fetch, 0);
    expect(request.variables).toEqual({
      cartId: 'cart-1',
      attributes: [
        { key: '_ph_distinct_id', value: 'visitor-1' },
        { key: '_ph_session_id', value: 'session-1' },
        { key: '_utm_source', value: 'google' },
        { key: '_gclid', value: 'Cj0K' },
      ],
    });
    expect(request.query).toContain(
      '@inContext(country: ES, language: ES, visitorConsent: {analytics: true, marketing: false, preferences: false, saleOfData: false})',
    );
    expect(request.init.cache).toBe('no-store');
  });

  it('clears earlier attributes and passes a rejection when the visitor declined analytics', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const fetch = queuedFetch(mutationResult('cartAttributesUpdate', checkoutCart('cart-1') as never));
    await adapterWith(fetch).getCheckoutUrl(cartWithOneItem(), { ...DEFAULT_CHECKOUT_CONTEXT, analyticsConsent: false });
    expect(sentRequest(fetch, 0).variables).toEqual({ cartId: 'cart-1', attributes: [] });
    expect(sentRequest(fetch, 0).query).toContain('visitorConsent: {analytics: false,');
  });

  it('leaves consent to Shopify while the visitor is undecided', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const fetch = queuedFetch(mutationResult('cartAttributesUpdate', checkoutCart('cart-1') as never));
    await adapterWith(fetch).getCheckoutUrl(cartWithOneItem(), DEFAULT_CHECKOUT_CONTEXT);
    expect(sentRequest(fetch, 0).query).toContain('@inContext(country: ES, language: ES)');
    expect(sentRequest(fetch, 0).query).not.toContain('visitorConsent');
  });

  it('creates the cart with its lines and attributes when there is no id', async () => {
    const fetch = queuedFetch(mutationResult('cartCreate', checkoutCart('cart-new') as never));
    const url = await adapterWith(fetch).getCheckoutUrl(cartWithOneItem(), consented);
    expect(url).toBe('https://shop.test/checkouts/cart-new?_cs=abc');
    expect(sentRequest(fetch, 0).variables).toEqual({
      lines: [{ merchandiseId: variantGid(1), quantity: 2 }],
      attributes: expect.arrayContaining([{ key: '_ph_distinct_id', value: 'visitor-1' }]),
    });
    expect(sentRequest(fetch, 0).query).toContain('cartCreate(input: { lines: $lines, attributes: $attributes })');
    expect(storage.getItem(SHOPIFY_CART_ID_KEY)).toBe('cart-new');
  });

  it('recreates the cart when the stored one has expired or was checked out', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'expired');
    const fetch = queuedFetch(
      mutationResult('cartAttributesUpdate', null, [{ message: 'The specified cart does not exist.' }]),
      mutationResult('cartCreate', checkoutCart('cart-new') as never),
    );
    await expect(adapterWith(fetch).getCheckoutUrl(cartWithOneItem(), consented)).resolves.toBe(
      'https://shop.test/checkouts/cart-new?_cs=abc',
    );
    expect(storage.getItem(SHOPIFY_CART_ID_KEY)).toBe('cart-new');
  });

  it('throws on user errors', async () => {
    const fetch = queuedFetch(mutationResult('cartCreate', null, [{ message: 'Invalid merchandise' }]));
    await expect(adapterWith(fetch).getCheckoutUrl(cartWithOneItem(), consented)).rejects.toThrow(
      'cartCreate failed: Invalid merchandise',
    );
  });
});

describe('LocalCheckoutAdapter', () => {
  it('points to the in-app checkout', async () => {
    await expect(new LocalCheckoutAdapter().getCheckoutUrl()).resolves.toBe('/checkout');
  });
});
