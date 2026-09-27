import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShopifyProductAdapter } from './ShopifyProductAdapter';
import { NotFoundError } from '@/domain/errors';
import { ProductId } from '@/domain/value-objects/ProductId';
import { CATALOG_REVALIDATE_SECONDS, STOREFRONT_CONTEXT, ShopifyApiError } from '@/infrastructure/adapters/shopify/ShopifyClient';
import {
  peopleVariant,
  productNode,
  productWithVariants,
  queuedFetch,
  sentRequest,
  testClient,
  variantGid,
  variantNode,
} from '@/infrastructure/testing/shopifyFixtures';

const page = (nodes: unknown[], endCursor: string | null, hasNextPage: boolean) => ({
  data: { products: { pageInfo: { hasNextPage, endCursor }, nodes } },
});

const zeroPriced = (n: number) => variantNode(n, { price: { amount: '0.0', currencyCode: 'EUR' } });

describe('ShopifyProductAdapter', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
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
    expect(warn).toHaveBeenCalledWith('[shopify] Skipping product "a": it has no variants');
  });

  it('skips products that break a domain rule instead of failing the whole catalog', async () => {
    const fetch = queuedFetch(
      page(
        [
          productWithVariants({ handle: 'ok' }, [variantNode(1)]),
          productWithVariants({ handle: 'free-sample' }, [zeroPriced(2)]),
          productWithVariants({ handle: 'Bad Handle' }, [variantNode(3)]),
          productWithVariants({ handle: 'also-ok' }, [variantNode(4)]),
        ],
        null,
        false,
      ),
    );
    const products = await new ShopifyProductAdapter(testClient(fetch)).findAll();
    expect(products.map((product) => product.slug)).toEqual(['ok', 'also-ok']);
    expect(warn).toHaveBeenCalledWith('[shopify] Skipping product "free-sample": Price must be positive');
    expect(warn).toHaveBeenCalledWith('[shopify] Skipping product "Bad Handle": Invalid product slug: Bad Handle');
  });

  it('treats an unmappable product as not found by handle or id', async () => {
    const byHandle = queuedFetch({ data: { product: productWithVariants({ handle: 'free-sample' }, [zeroPriced(2)]) } });
    await expect(new ShopifyProductAdapter(testClient(byHandle)).findBySlug('free-sample')).rejects.toBeInstanceOf(NotFoundError);

    const byId = queuedFetch({ data: { node: { ...zeroPriced(2), product: productNode({ handle: 'free-sample' }) } } });
    await expect(new ShopifyProductAdapter(testClient(byId)).findById(new ProductId(variantGid(2)))).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('queries every operation in the Spanish context and lets Next.js cache catalog reads', async () => {
    const fetch = queuedFetch(
      page([], null, false),
      { data: { product: productWithVariants() } },
      { data: { node: { ...variantNode(1), product: productNode() } } },
    );
    const adapter = new ShopifyProductAdapter(testClient(fetch));
    await adapter.findAll();
    await adapter.findBySlug('mochila-24h');
    await adapter.findById(new ProductId(variantGid(1)));
    const expected = [
      'query Products($first: Int!, $after: String)',
      'query ProductByHandle($handle: String!)',
      'query VariantById($id: ID!)',
    ];
    expected.forEach((operation, call) => {
      const request = sentRequest(fetch, call);
      expect(request.query).toContain(`${operation} ${STOREFRONT_CONTEXT} {`);
      expect(request.init.next).toEqual({ revalidate: CATALOG_REVALIDATE_SECONDS });
      expect(request.init.cache).toBeUndefined();
    });
    expect(CATALOG_REVALIDATE_SECONDS).toBe(300);
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

  describe('variants', () => {
    const kitVariants = [
      peopleVariant(11, 1, '119.0', { availableForSale: false }),
      peopleVariant(12, 2, '199.0'),
      peopleVariant(14, 4, '359.0'),
    ];

    it('maps every variant and selects the first one for sale', async () => {
      const fetch = queuedFetch({ data: { product: productWithVariants({ handle: 'kit-72h' }, kitVariants) } });
      const kit = await new ShopifyProductAdapter(testClient(fetch)).findBySlug('kit-72h');
      expect(kit.variants.map((variant) => variant.title)).toEqual(['1 persona', '2 personas', '4 personas']);
      expect(kit.id.value).toBe(variantGid(12));
      expect(kit.price.amount).toBe(199);
      expect(sentRequest(fetch, 0).query).toContain('variants(first: 20)');
      expect(sentRequest(fetch, 0).query).toContain('selectedOptions { name value }');
    });

    it('resolves a variant id to its product with that variant selected and all variants known', async () => {
      const fetch = queuedFetch({
        data: { node: { ...kitVariants[2], product: productWithVariants({ handle: 'kit-72h' }, kitVariants) } },
      });
      const kit = await new ShopifyProductAdapter(testClient(fetch)).findById(new ProductId(variantGid(14)));
      expect(kit.id.value).toBe(variantGid(14));
      expect(kit.variantTitle).toBe('4 personas');
      expect(kit.variants).toHaveLength(3);
    });
  });
});
