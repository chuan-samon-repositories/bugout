import { afterEach, describe, expect, it, vi } from 'vitest';
import { createContainer, getContainer, resetContainer } from './container';
import { AppConfig } from '@/infrastructure/config/appConfig';
import { NoopAnalyticsAdapter } from '@/infrastructure/adapters/analytics/NoopAnalyticsAdapter';
import { PostHogAnalyticsAdapter } from '@/infrastructure/adapters/analytics/PostHogAnalyticsAdapter';
import { SessionStorageOrderConfirmationStore } from '@/infrastructure/adapters/order/SessionStorageOrderConfirmationStore';
import { storePricingPolicy } from '@/infrastructure/config/pricingPolicy';
import { cartNode, jsonResponse } from '@/infrastructure/testing/shopifyFixtures';
import { buildCheckoutDetails } from '@/application/testing/checkoutDetails';
import { ProductId } from '@/domain/value-objects/ProductId';
import { Quantity } from '@/domain/value-objects/Quantity';

const local: AppConfig = { provider: 'local', posthog: null, simulatedDelayMs: 0 };
const shopify: AppConfig = {
  provider: 'shopify',
  posthog: null,
  shopify: { storeDomain: 'bugout-test.myshopify.com', storefrontAccessToken: 'token' },
};

function stubLocalStorage(): Map<string, string> {
  const data = new Map<string, string>();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    },
  });
  return data;
}

describe('AppContainer', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetContainer();
  });

  it('exposes the provider and the store pricing policy', () => {
    expect(createContainer(local).getProvider()).toBe('local');
    expect(createContainer(shopify).getProvider()).toBe('shopify');
    expect(createContainer(local).getPricingPolicy()).toBe(storePricingPolicy);
  });

  it('caches use cases and services per container', () => {
    const container = createContainer(local);
    expect(container.getGetProductsUseCase()).toBe(container.getGetProductsUseCase());
    expect(container.getManageCartUseCase()).toBe(container.getManageCartUseCase());
    expect(container.getAnalyticsService()).toBe(container.getAnalyticsService());
    expect(container.getConsentRepository()).toBe(container.getConsentRepository());
    expect(createContainer(local).getGetProductsUseCase()).not.toBe(container.getGetProductsUseCase());
  });

  it('shares one product repository between use cases', () => {
    const container = createContainer(local);
    const repositoryOf = (useCase: object) => (useCase as unknown as { productRepository: unknown }).productRepository;
    expect(repositoryOf(container.getGetProductsUseCase())).toBe(repositoryOf(container.getGetProductBySlugUseCase()));
    expect(repositoryOf(container.getGetProductsUseCase())).toBe(repositoryOf(container.getManageCartUseCase()));
  });

  it('serves the bundled catalog and the in-app checkout with the local provider', async () => {
    const container = createContainer(local);
    const products = await container.getGetProductsUseCase().execute();
    expect(products).toHaveLength(20);
    expect(products[0].price.currency).toBe('EUR');
    await expect(container.getGetProductBySlugUseCase().execute('kit-medicina')).resolves.toMatchObject({ slug: 'kit-medicina' });
    // No browser storage in node: the cart is empty, so checkout is refused.
    await expect(container.getCreateCheckoutUseCase().execute()).rejects.toThrow('Cart is empty');
  });

  it('starts the in-app checkout for a non-empty local cart', async () => {
    stubLocalStorage();
    const container = createContainer(local);
    await container.getManageCartUseCase().addToCart(new ProductId('kit-medicina'), new Quantity(1));
    await expect(container.getCreateCheckoutUseCase().execute()).resolves.toEqual({ url: '/checkout', type: 'local' });
  });

  it('reports the newsletter and contact forms as simulated under both providers', () => {
    expect(createContainer(local).isMessagingSimulated()).toBe(true);
    expect(createContainer(shopify).isMessagingSimulated()).toBe(true);
  });

  it('wires the local order, newsletter and contact services', async () => {
    const container = createContainer(local);
    await expect(container.getSubscribeNewsletterUseCase().execute('ana@example.es')).resolves.toBeUndefined();
    await expect(
      container.getSendContactMessageUseCase().execute({
        name: 'Ana',
        email: 'ana@example.es',
        topic: 'general',
        subject: 'Hola',
        message: 'Una pregunta sobre envíos',
      }),
    ).resolves.toBeUndefined();
    // No browser storage in node: the cart is empty, so placing an order is refused.
    await expect(container.getPlaceOrderUseCase().execute(buildCheckoutDetails())).rejects.toThrow(/empty cart/);
  });

  it('adds products to the local cart through the catalog', async () => {
    const data = stubLocalStorage();
    const { cart } = await createContainer(local).getManageCartUseCase().addToCart(new ProductId('kit-medicina'), new Quantity(2));
    expect(cart.totalAmount().minor).toBe(3600);
    expect(JSON.parse(data.get('bugout.cart') ?? '{}')).toEqual({ version: 2, items: [{ productId: 'kit-medicina', quantity: 2 }] });
  });

  it('talks to the Shopify Storefront API with the Shopify provider', async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({ data: { products: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } } }),
    );
    vi.stubGlobal('fetch', fetch);
    await expect(createContainer(shopify).getGetProductsUseCase().execute()).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('https://bugout-test.myshopify.com/api/2026-07/graphql.json', expect.any(Object));
  });

  it('lists the storage keys other tabs must react to', () => {
    const keys = createContainer(local).getSyncedStorageKeys();
    expect(keys).toEqual({
      cart: ['bugout.cart', 'bugout.shopify-cart-id', 'bugout.shopify-cart-rev'],
      consent: 'bugout.consent',
    });
    expect(createContainer(shopify).getSyncedStorageKeys()).toEqual(keys);
  });

  it('keeps the last order in a session-scoped store', () => {
    const container = createContainer(local);
    expect(container.getOrderConfirmationStore()).toBeInstanceOf(SessionStorageOrderConfirmationStore);
    expect(container.getOrderConfirmationStore()).toBe(container.getOrderConfirmationStore());
    // No browser storage in node.
    expect(container.getOrderConfirmationStore().load()).toBeNull();
  });

  it('starts the Shopify checkout with the checkout URL of the cart it just loaded', async () => {
    const data = stubLocalStorage();
    data.set('bugout.shopify-cart-id', 'cart-1');
    const remote = cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 1 }]);
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ data: { cart: remote } }));
    vi.stubGlobal('fetch', fetch);
    await expect(createContainer(shopify).getCreateCheckoutUseCase().execute()).resolves.toEqual({
      url: remote.checkoutUrl,
      type: 'hosted',
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('uses PostHog only when a key is configured', () => {
    expect(createContainer(local).getAnalyticsService()).toBeInstanceOf(NoopAnalyticsAdapter);
    expect(createContainer({ ...local, posthog: { apiKey: 'phc' } }).getAnalyticsService()).toBeInstanceOf(PostHogAnalyticsAdapter);
  });
});

describe('getContainer', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetContainer();
  });

  it('builds a singleton from the environment', () => {
    vi.stubEnv('NEXT_PUBLIC_COMMERCE_PROVIDER', 'local');
    const container = getContainer();
    expect(getContainer()).toBe(container);
    expect(container.getProvider()).toBe('local');
  });

  it('re-reads the environment after resetContainer()', () => {
    vi.stubEnv('NEXT_PUBLIC_COMMERCE_PROVIDER', 'local');
    const first = getContainer();
    resetContainer();
    vi.stubEnv('NEXT_PUBLIC_COMMERCE_PROVIDER', 'shopify');
    vi.stubEnv('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN', 'bugout.myshopify.com');
    vi.stubEnv('NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN', 'token');
    const second = getContainer();
    expect(second).not.toBe(first);
    expect(second.getProvider()).toBe('shopify');
  });

  it('fails fast on invalid configuration', () => {
    vi.stubEnv('NEXT_PUBLIC_COMMERCE_PROVIDER', 'shopify');
    vi.stubEnv('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN', '');
    vi.stubEnv('NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN', '');
    expect(() => getContainer()).toThrow(/NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN/);
  });
});
