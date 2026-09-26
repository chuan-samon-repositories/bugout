import { describe, expect, it } from 'vitest';
import { DEFAULT_SHOPIFY_API_VERSION, ShopifyApiError, ShopifyClient, assertNoUserErrors } from './ShopifyClient';
import { CART_CREATE_MUTATION, CART_QUERY } from './cartGraphql';
import { jsonResponse, queuedFetch, sentRequest } from '../../testing/shopifyFixtures';

describe('ShopifyClient', () => {
  it('posts the query to the Storefront endpoint with the access token', async () => {
    const fetch = queuedFetch({ data: { shop: { name: 'Bugout' } } });
    const client = new ShopifyClient({ storeDomain: 'bugout.myshopify.com', storefrontAccessToken: 'tok' }, fetch);

    await expect(client.request('query { shop { name } }', { a: 1 })).resolves.toEqual({ shop: { name: 'Bugout' } });

    const request = sentRequest(fetch, 0);
    expect(request.url).toBe(`https://bugout.myshopify.com/api/${DEFAULT_SHOPIFY_API_VERSION}/graphql.json`);
    expect(DEFAULT_SHOPIFY_API_VERSION).toBe('2026-07');
    expect(request.init.method).toBe('POST');
    expect(request.init.headers).toMatchObject({ 'X-Shopify-Storefront-Access-Token': 'tok', 'Content-Type': 'application/json' });
    expect(request.variables).toEqual({ a: 1 });
  });

  it('caches queries for 5 minutes but never mutations or no-store requests', async () => {
    const fetch = queuedFetch({ data: {} }, { data: {} }, { data: {} }, { data: {} });
    const client = new ShopifyClient({ storeDomain: 's', storefrontAccessToken: 't' }, fetch);
    await client.request('query Shop { shop { name } }');
    await client.request(CART_CREATE_MUTATION, { lines: [] });
    await client.request(CART_QUERY, { id: 'c' }, { noStore: true });
    await client.request('# comment-free anonymous query\n{ shop { name } }');

    expect(sentRequest(fetch, 0).init).toMatchObject({ next: { revalidate: 300 } });
    expect(sentRequest(fetch, 0).init.cache).toBeUndefined();
    expect(sentRequest(fetch, 1).init).toMatchObject({ cache: 'no-store' });
    expect(sentRequest(fetch, 1).init.next).toBeUndefined();
    expect(sentRequest(fetch, 2).init).toMatchObject({ cache: 'no-store' });
    expect(sentRequest(fetch, 2).init.next).toBeUndefined();
    expect(sentRequest(fetch, 3).init).toMatchObject({ next: { revalidate: 300 } });
  });

  it('honours a configured API version and tolerates a protocol in the domain', () => {
    const client = new ShopifyClient({ storeDomain: 'https://shop.example/', storefrontAccessToken: 't', apiVersion: '2025-10' });
    expect(client.endpoint).toBe('https://shop.example/api/2025-10/graphql.json');
  });

  it('throws ShopifyApiError on non-2xx responses', async () => {
    const client = new ShopifyClient({ storeDomain: 's', storefrontAccessToken: 't' }, queuedFetch(jsonResponse({}, 401)));
    const error = await client.request('{ shop { name } }').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ShopifyApiError);
    expect((error as ShopifyApiError).message).toMatch(/HTTP 401/);
    expect((error as ShopifyApiError).details.status).toBe(401);
  });

  it('throws ShopifyApiError on top-level GraphQL errors', async () => {
    const fetch = queuedFetch({ errors: [{ message: 'Field "x" does not exist' }, { message: 'Throttled' }] });
    const client = new ShopifyClient({ storeDomain: 's', storefrontAccessToken: 't' }, fetch);
    await expect(client.request('{ x }')).rejects.toThrow('Shopify GraphQL error: Field "x" does not exist; Throttled');
  });

  it('throws ShopifyApiError on network failures, invalid JSON and missing data', async () => {
    const config = { storeDomain: 's', storefrontAccessToken: 't' };
    const offline = new ShopifyClient(config, () => Promise.reject(new TypeError('fetch failed')));
    await expect(offline.request('{ x }')).rejects.toThrow(/Shopify request failed: fetch failed/);

    const garbage = new ShopifyClient(config, queuedFetch(new Response('<html>', { status: 200 })));
    await expect(garbage.request('{ x }')).rejects.toThrow(/invalid JSON/);

    const empty = new ShopifyClient(config, queuedFetch({ data: null }));
    await expect(empty.request('{ x }')).rejects.toBeInstanceOf(ShopifyApiError);
  });

  it('uses the global fetch when none is injected', async () => {
    const fetch = queuedFetch({ data: { ok: true } });
    const original = globalThis.fetch;
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
    try {
      await new ShopifyClient({ storeDomain: 's', storefrontAccessToken: 't' }).request('{ ok }');
      expect(fetch).toHaveBeenCalledOnce();
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('assertNoUserErrors', () => {
  it('passes for empty or missing user errors', () => {
    expect(() => assertNoUserErrors('cartCreate', [])).not.toThrow();
    expect(() => assertNoUserErrors('cartCreate', undefined)).not.toThrow();
  });

  it('throws with every message', () => {
    expect(() =>
      assertNoUserErrors('cartLinesAdd', [
        { field: ['lines', '0'], message: 'Out of stock', code: 'INVALID' },
        { message: 'Limit reached' },
      ]),
    ).toThrow('cartLinesAdd failed: Out of stock; Limit reached');
  });
});
