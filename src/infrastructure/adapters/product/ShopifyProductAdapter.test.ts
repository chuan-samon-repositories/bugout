import { describe, expect, it } from 'vitest';
import { ShopifyProductAdapter } from './ShopifyProductAdapter';
import { NotFoundError } from '@/domain/errors';
import { ProductId } from '@/domain/value-objects/ProductId';
import { ShopifyApiError } from '../shopify/ShopifyClient';
import {
  productNode,
  productWithVariants,
  queuedFetch,
  sentRequest,
  testClient,
  variantGid,
  variantNode,
} from '../../testing/shopifyFixtures';

const page = (nodes: unknown[], endCursor: string | null, hasNextPage: boolean) => ({
  data: { products: { pageInfo: { hasNextPage, endCursor }, nodes } },
});

describe('ShopifyProductAdapter', () => {
  it('pages through all products until the last page', async () => {
    const fetch = queuedFetch(
      page([productWithVariants({ handle: 'a' }, [variantNode(1)]), productWithVariants({ handle: 'b' }, [variantNode(2)])], 'c1', true),
      page([productWithVariants({ handle: 'c' }, [variantNode(3)])], 'c2', false),
    );
    const products = await new ShopifyProductAdapter(testClient(fetch)).findAll();

    expect(products.map((product) => product.slug)).toEqual(['a', 'b', 'c']);
    expect(products.map((product) => product.id.value)).toEqual([variantGid(1), variantGid(2), variantGid(3)]);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sentRequest(fetch, 0).variables).toEqual({ first: 100, after: null });
    expect(sentRequest(fetch, 1).variables).toEqual({ first: 100, after: 'c1' });
    expect(sentRequest(fetch, 0).query).toContain('fragment ProductFields on Product');
  });

  it('skips products without variants', async () => {
    const fetch = queuedFetch(page([productWithVariants({ handle: 'a' }, []), productWithVariants({ handle: 'b' })], null, false));
    const products = await new ShopifyProductAdapter(testClient(fetch)).findAll();
    expect(products.map((product) => product.slug)).toEqual(['b']);
  });

  it('surfaces top-level GraphQL errors', async () => {
    const fetch = queuedFetch({ errors: [{ message: 'Access denied' }] });
    await expect(new ShopifyProductAdapter(testClient(fetch)).findAll()).rejects.toBeInstanceOf(ShopifyApiError);
  });

  it('finds a product by handle', async () => {
    const fetch = queuedFetch({ data: { product: productWithVariants({ handle: 'mochila-72h' }, [variantNode(9)]) } });
    const product = await new ShopifyProductAdapter(testClient(fetch)).findBySlug('mochila-72h');
    expect(product.id.value).toBe(variantGid(9));
    expect(sentRequest(fetch, 0).variables).toEqual({ handle: 'mochila-72h' });
    expect(sentRequest(fetch, 0).query).toContain('product(handle: $handle)');
  });

  it('throws NotFoundError for an unknown handle', async () => {
    const fetch = queuedFetch({ data: { product: null } });
    await expect(new ShopifyProductAdapter(testClient(fetch)).findBySlug('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('finds a product by variant id', async () => {
    const fetch = queuedFetch({ data: { node: { ...variantNode(5), product: productNode({ handle: 'botiquin' }) } } });
    const product = await new ShopifyProductAdapter(testClient(fetch)).findById(new ProductId(variantGid(5)));
    expect(product.slug).toBe('botiquin');
    expect(product.id.value).toBe(variantGid(5));
    expect(sentRequest(fetch, 0).query).toContain('node(id: $id)');
  });

  it('throws NotFoundError for unknown or non-variant ids', async () => {
    const missing = queuedFetch({ data: { node: null } });
    await expect(new ShopifyProductAdapter(testClient(missing)).findById(new ProductId(variantGid(1)))).rejects.toBeInstanceOf(NotFoundError);

    const notVariant = queuedFetch({ data: { node: {} } });
    await expect(new ShopifyProductAdapter(testClient(notVariant)).findById(new ProductId(variantGid(1)))).rejects.toBeInstanceOf(NotFoundError);

    const untouched = queuedFetch();
    await expect(new ShopifyProductAdapter(testClient(untouched)).findById(new ProductId('24h-survival-backpack'))).rejects.toBeInstanceOf(NotFoundError);
    expect(untouched).not.toHaveBeenCalled();
  });
});
