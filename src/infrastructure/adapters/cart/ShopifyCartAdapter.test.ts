import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ManageCartUseCase } from '@/application/use-cases/ManageCartUseCase';
import { InMemoryProductRepository } from '@/application/testing/fakes';
import { ShopifyCartAdapter } from './ShopifyCartAdapter';
import {
  SHOPIFY_CART_ID_KEY,
  SHOPIFY_CART_REVISION_KEY,
  ShopifyCartIdStore,
} from '@/infrastructure/adapters/shopify/ShopifyCartIdStore';
import { STOREFRONT_CONTEXT, ShopifyApiError } from '@/infrastructure/adapters/shopify/ShopifyClient';
import { mapShopifyProduct } from '@/infrastructure/adapters/shopify/productMapping';
import { MemoryStorage } from '@/infrastructure/testing/MemoryStorage';
import {
  cartNode,
  mutationResult,
  peopleVariant,
  productNode,
  queuedFetch,
  sentRequest,
  testClient,
  variantGid,
  variantNode,
} from '@/infrastructure/testing/shopifyFixtures';
import { Cart } from '@/domain/entities/cart/Cart';
import { ProductId } from '@/domain/value-objects/ProductId';
import { Quantity } from '@/domain/value-objects/Quantity';

const product = (n: number) => mapShopifyProduct(productNode({ handle: `producto-${n}` }), variantNode(n));
const pid = (n: number) => new ProductId(variantGid(n));

describe('ShopifyCartAdapter', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  function adapterWith(fetch: ReturnType<typeof queuedFetch>) {
    return new ShopifyCartAdapter(testClient(fetch), new ShopifyCartIdStore(storage), 'EUR');
  }

  it('returns an empty cart without a stored id, without calling Shopify', async () => {
    const fetch = queuedFetch();
    const cart = await adapterWith(fetch).load();
    expect(cart.isEmpty()).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('forgets the id and returns an empty cart when Shopify has no such cart', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'gid://shopify/Cart/expired');
    const cart = await adapterWith(queuedFetch({ data: { cart: null } })).load();
    expect(cart.isEmpty()).toBe(true);
    expect(storage.getItem(SHOPIFY_CART_ID_KEY)).toBeNull();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps remote lines to a cart, skipping unavailable ones and clamping quantities', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const fetch = queuedFetch({
      data: {
        cart: cartNode('cart-1', [
          { lineId: 'l1', variant: 1, quantity: 2 },
          { lineId: 'l2', variant: 2, quantity: 1, available: false },
          { lineId: 'l3', variant: 3, quantity: 150 },
        ]),
      },
    });
    const adapter = adapterWith(fetch);
    const cart = await adapter.load();
    expect(cart.quantityOf(pid(1))).toBe(2);
    expect(cart.quantityOf(pid(2))).toBe(0);
    expect(cart.quantityOf(pid(3))).toBe(99);
    expect(sentRequest(fetch, 0).variables).toEqual({ id: 'cart-1' });
    expect(adapter.loadNotices()).toEqual([{ kind: 'removed', productId: variantGid(2), productName: 'Producto 2' }]);
  });

  it('names dropped kit lines with their size, and clears the notices on the next load', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const kit = productNode({ handle: 'kit-72h', title: 'Kit 72h' });
    const fetch = queuedFetch(
      {
        data: {
          cart: cartNode('cart-1', [
            { lineId: 'l1', variant: 12, quantity: 1, available: false, merchandise: peopleVariant(12, 2, '199.0'), product: kit },
          ]),
        },
      },
      { data: { cart: cartNode('cart-1') } },
    );
    const adapter = adapterWith(fetch);
    await adapter.load();
    expect(adapter.loadNotices()).toEqual([{ kind: 'removed', productId: variantGid(12), productName: 'Kit 72h · 2 personas' }]);
    await adapter.load();
    expect(adapter.loadNotices()).toEqual([]);
  });

  it('keeps two sizes of the same kit as two lines keyed by variant GID', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const kit = productNode({ handle: 'kit-72h', title: 'Kit 72h' });
    const two = peopleVariant(12, 2, '199.0');
    const four = peopleVariant(14, 4, '359.0');
    const remote = cartNode('cart-1', [
      { lineId: 'l12', variant: 12, quantity: 1, merchandise: two, product: kit },
      { lineId: 'l14', variant: 14, quantity: 2, merchandise: four, product: kit },
    ]);
    const fetch = queuedFetch({ data: { cart: remote } }, mutationResult('cartLinesUpdate', remote));
    const adapter = adapterWith(fetch);

    const cart = await adapter.load();
    expect(cart.getItems().map((item) => [item.product.id.value, item.product.displayName, item.quantity.value])).toEqual([
      [variantGid(12), 'Kit 72h · 2 personas', 1],
      [variantGid(14), 'Kit 72h · 4 personas', 2],
    ]);
    expect(cart.totalAmount().minor).toBe(19900 + 2 * 35900);

    cart.setQuantity(pid(14), new Quantity(3));
    await adapter.save(cart);
    // Only the 4-person line changes; the 2-person line of the same product is untouched.
    expect(sentRequest(fetch, 1).variables).toEqual({ cartId: 'cart-1', lines: [{ id: 'l14', quantity: 3 }] });
  });

  it('keeps the variant title of kit lines so the drawer shows "2 personas"', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const fetch = queuedFetch({
      data: { cart: cartNode('cart-1', [{ lineId: 'l1', variant: 12, quantity: 1, merchandise: peopleVariant(12, 2, '199.0') }]) },
    });
    const [item] = (await adapterWith(fetch).load()).getItems();
    expect(item.product.id.value).toBe(variantGid(12));
    expect(item.product.variantTitle).toBe('2 personas');
    expect(item.product.displayName).toBe('Producto 12 · 2 personas');
  });

  it('creates the cart on the first save and stores its id', async () => {
    const fetch = queuedFetch(mutationResult('cartCreate', cartNode('cart-new', [{ lineId: 'l1', variant: 1, quantity: 2 }])));
    const adapter = adapterWith(fetch);
    const cart = new Cart('EUR');
    cart.addItem(product(1), new Quantity(2));

    await adapter.save(cart);

    expect(sentRequest(fetch, 0).query).toContain('cartCreate');
    expect(sentRequest(fetch, 0).variables).toEqual({ lines: [{ merchandiseId: variantGid(1), quantity: 2 }] });
    expect(storage.getItem(SHOPIFY_CART_ID_KEY)).toBe('cart-new');
  });

  it('does not create a remote cart for an empty aggregate', async () => {
    const fetch = queuedFetch();
    await adapterWith(fetch).save(new Cart('EUR'));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('diffs against the loaded lines and sends only the needed mutations', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const remote = cartNode('cart-1', [
      { lineId: 'l1', variant: 1, quantity: 2 },
      { lineId: 'l2', variant: 2, quantity: 1 },
      { lineId: 'l3', variant: 3, quantity: 4 },
    ]);
    const fetch = queuedFetch(
      { data: { cart: remote } },
      mutationResult('cartLinesRemove', remote),
      mutationResult('cartLinesUpdate', remote),
      mutationResult('cartLinesAdd', remote),
    );
    const adapter = adapterWith(fetch);

    const cart = await adapter.load();
    cart.setQuantity(pid(1), new Quantity(5)); // update
    cart.deleteItem(pid(2)); // remove
    cart.addItem(product(4), new Quantity(1)); // add; line 3 untouched
    await adapter.save(cart);

    expect(fetch).toHaveBeenCalledTimes(4);
    expect(sentRequest(fetch, 1)).toMatchObject({ variables: { cartId: 'cart-1', lineIds: ['l2'] } });
    expect(sentRequest(fetch, 1).query).toContain('cartLinesRemove');
    expect(sentRequest(fetch, 2)).toMatchObject({ variables: { cartId: 'cart-1', lines: [{ id: 'l1', quantity: 5 }] } });
    expect(sentRequest(fetch, 2).query).toContain('cartLinesUpdate');
    expect(sentRequest(fetch, 3)).toMatchObject({
      variables: { cartId: 'cart-1', lines: [{ merchandiseId: variantGid(4), quantity: 1 }] },
    });
    expect(sentRequest(fetch, 3).query).toContain('cartLinesAdd');
    expect(fetch.mock.calls.some((_, index) => sentRequest(fetch, index).query.includes('cartCreate'))).toBe(false);
  });

  it('sends nothing when the aggregate matches the remote cart', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const fetch = queuedFetch({ data: { cart: cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 2 }]) } });
    const adapter = adapterWith(fetch);
    await adapter.save(await adapter.load());
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('uses the mutation result for the next diff', async () => {
    const created = cartNode('cart-new', [{ lineId: 'l1', variant: 1, quantity: 1 }]);
    const fetch = queuedFetch(mutationResult('cartCreate', created), mutationResult('cartLinesUpdate', created));
    const adapter = adapterWith(fetch);
    const cart = new Cart('EUR');
    cart.addItem(product(1), new Quantity(1));
    await adapter.save(cart);

    cart.addItem(product(1), new Quantity(1));
    await adapter.save(cart);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sentRequest(fetch, 1).variables).toEqual({ cartId: 'cart-new', lines: [{ id: 'l1', quantity: 2 }] });
  });

  it('fetches the remote lines before diffing when it has not loaded them yet', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const remote = cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 1 }]);
    const fetch = queuedFetch({ data: { cart: remote } }, mutationResult('cartLinesUpdate', remote));
    const cart = new Cart('EUR');
    cart.addItem(product(1), new Quantity(3));

    await adapterWith(fetch).save(cart);

    expect(sentRequest(fetch, 0).query).toContain('query Cart');
    expect(sentRequest(fetch, 1).variables).toEqual({ cartId: 'cart-1', lines: [{ id: 'l1', quantity: 3 }] });
  });

  it('merges duplicate remote lines for the same variant', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const remote = cartNode('cart-1', [
      { lineId: 'l1', variant: 1, quantity: 1 },
      { lineId: 'l1b', variant: 1, quantity: 2 },
    ]);
    const fetch = queuedFetch(
      { data: { cart: remote } },
      mutationResult('cartLinesRemove', remote),
      mutationResult('cartLinesUpdate', remote),
    );
    const adapter = adapterWith(fetch);
    const cart = await adapter.load();
    expect(cart.quantityOf(pid(1))).toBe(3);

    await adapter.save(cart);
    expect(sentRequest(fetch, 1).variables).toEqual({ cartId: 'cart-1', lineIds: ['l1b'] });
    expect(sentRequest(fetch, 2).variables).toEqual({ cartId: 'cart-1', lines: [{ id: 'l1', quantity: 3 }] });
  });

  it('removes lines Shopify still has but the aggregate dropped (e.g. sold out)', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const remote = cartNode('cart-1', [
      { lineId: 'l1', variant: 1, quantity: 1 },
      { lineId: 'l2', variant: 2, quantity: 1, available: false },
    ]);
    const fetch = queuedFetch({ data: { cart: remote } }, mutationResult('cartLinesRemove', remote));
    const adapter = adapterWith(fetch);
    await adapter.save(await adapter.load());
    expect(sentRequest(fetch, 1).variables).toEqual({ cartId: 'cart-1', lineIds: ['l2'] });
  });

  describe('what Shopify actually holds', () => {
    it('asks every cart mutation for its warnings', async () => {
      const fetch = queuedFetch(mutationResult('cartCreate', cartNode('cart-new', [{ lineId: 'l1', variant: 1, quantity: 1 }])));
      const cart = new Cart('EUR');
      cart.addItem(product(1), new Quantity(1));
      await adapterWith(fetch).save(cart);
      expect(sentRequest(fetch, 0).query).toContain('warnings { code message target }');
    });

    it('resolves to the cart Shopify returned when it lowered a quantity to the stock', async () => {
      storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
      const remote = cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 1 }]);
      const clamped = cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 3 }]);
      const fetch = queuedFetch(
        { data: { cart: remote } },
        mutationResult('cartLinesUpdate', clamped, [], [
          { code: 'MERCHANDISE_NOT_ENOUGH_STOCK', message: 'Only 3 items were added to your cart due to availability.', target: 'l1' },
        ]),
      );
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const adapter = adapterWith(fetch);
      const cart = await adapter.load();
      cart.setQuantity(pid(1), new Quantity(5));

      const saved = await adapter.save(cart);

      expect(saved.quantityOf(pid(1))).toBe(3);
      expect(warn).not.toHaveBeenCalled();
    });

    it('lets the use case report quantities Shopify lowered and lines it did not add', async () => {
      storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
      const remote = cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 1 }]);
      const fetch = queuedFetch(
        { data: { cart: remote } },
        mutationResult('cartLinesAdd', remote, [], [
          { code: 'MERCHANDISE_OUT_OF_STOCK', message: 'The product is out of stock.', target: 'cart-1' },
        ]),
        { data: { cart: remote } },
        mutationResult('cartLinesUpdate', cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 4 }]), [], [
          { code: 'MERCHANDISE_NOT_ENOUGH_STOCK', message: 'Only 4 items were added.', target: 'l1' },
        ]),
      );
      const catalog = new InMemoryProductRepository([product(1), product(2)]);
      const manageCart = new ManageCartUseCase(adapterWith(fetch), catalog);

      const soldOut = await manageCart.addToCart(pid(2), new Quantity(1));
      expect(soldOut.cart.quantityOf(pid(2))).toBe(0);
      expect(soldOut.notices).toEqual([{ kind: 'removed', productId: variantGid(2), productName: 'Mochila 24H' }]);

      const lowered = await manageCart.addToCart(pid(1), new Quantity(9));
      expect(lowered.cart.quantityOf(pid(1))).toBe(4);
      expect(lowered.notices).toEqual([
        { kind: 'quantityReduced', productId: variantGid(1), productName: 'Mochila 24H', requested: 10, quantity: 4 },
      ]);
    });

    it('removes lines the load dropped on the next getCart, so they are reported once', async () => {
      storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
      const remote = cartNode('cart-1', [
        { lineId: 'l1', variant: 1, quantity: 1 },
        { lineId: 'l2', variant: 2, quantity: 1, available: false },
      ]);
      const after = cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 1 }]);
      const fetch = queuedFetch({ data: { cart: remote } }, mutationResult('cartLinesRemove', after), { data: { cart: after } });
      const manageCart = new ManageCartUseCase(adapterWith(fetch), new InMemoryProductRepository());

      const first = await manageCart.getCart();
      expect(first.notices).toEqual([{ kind: 'removed', productId: variantGid(2), productName: 'Producto 2' }]);
      expect(first.cart.quantityOf(pid(1))).toBe(1);
      expect(sentRequest(fetch, 1).variables).toEqual({ cartId: 'cart-1', lineIds: ['l2'] });

      expect((await manageCart.getCart()).notices).toEqual([]);
    });

    it('logs warnings that are not about stock', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fetch = queuedFetch(
        mutationResult('cartCreate', cartNode('cart-new', [{ lineId: 'l1', variant: 1, quantity: 1 }]), [], [
          { code: 'PAYMENTS_GIFT_CARDS_UNAVAILABLE', message: 'Gift cards are not available.', target: 'cart-new' },
        ]),
      );
      const cart = new Cart('EUR');
      cart.addItem(product(1), new Quantity(1));
      await adapterWith(fetch).save(cart);
      expect(warn).toHaveBeenCalledWith('[shopify] cartCreate warning PAYMENTS_GIFT_CARDS_UNAVAILABLE: Gift cards are not available.');
    });

    it('resolves to the given cart when nothing had to be sent', async () => {
      storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
      const fetch = queuedFetch({ data: { cart: cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 2 }]) } });
      const adapter = adapterWith(fetch);
      const cart = await adapter.load();
      await expect(adapter.save(cart)).resolves.toBe(cart);
    });
  });

  it('throws on user errors', async () => {
    const fetch = queuedFetch(mutationResult('cartCreate', null, [{ field: ['lines'], message: 'Variant is sold out' }]));
    const cart = new Cart('EUR');
    cart.addItem(product(1), new Quantity(1));
    const error = await adapterWith(fetch).save(cart).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ShopifyApiError);
    expect((error as Error).message).toBe('cartCreate failed: Variant is sold out');
    expect(storage.getItem(SHOPIFY_CART_ID_KEY)).toBeNull();
  });

  it('throws on top-level errors', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    await expect(adapterWith(queuedFetch({ errors: [{ message: 'Throttled' }] })).load()).rejects.toThrow(/Throttled/);
  });

  it('fails loudly instead of dropping lines priced in another currency', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const remote = cartNode('cart-1', [
      { lineId: 'l1', variant: 1, quantity: 2 },
      { lineId: 'l2', variant: 2, quantity: 1 },
    ]);
    remote.lines.nodes[1].merchandise.price = { amount: '10.0', currencyCode: 'USD' };
    const fetch = queuedFetch({ data: { cart: remote } });
    const error = await adapterWith(fetch).load().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ShopifyApiError);
    expect((error as Error).message).toMatch(/^Shopify returned prices in USD but the store currency is EUR/);
  });

  it('never deletes remote lines because of a currency mismatch', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const remote = cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 2 }]);
    remote.lines.nodes[0].merchandise.price = { amount: '10.0', currencyCode: 'USD' };
    const fetch = queuedFetch({ data: { cart: remote } });
    const manageCart = new ManageCartUseCase(adapterWith(fetch), new InMemoryProductRepository([product(3)]));
    await expect(manageCart.addToCart(pid(3), new Quantity(1))).rejects.toThrow(/currency/);
    // Only the cart read: the failed load stops the use case before any line mutation.
    expect(fetch).toHaveBeenCalledOnce();
    expect(sentRequest(fetch, 0).query).toContain('query Cart(');
  });

  it('reads the cart in the Spanish context without any caching', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const fetch = queuedFetch({ data: { cart: cartNode('cart-1') } });
    await adapterWith(fetch).load();
    const request = sentRequest(fetch, 0);
    expect(request.query).toContain(`query Cart($id: ID!) ${STOREFRONT_CONTEXT}`);
    expect(request.init.cache).toBe('no-store');
    expect(request.init.next).toBeUndefined();
  });

  it('sends every cart mutation in the Spanish context without any caching', async () => {
    const created = cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 1 }]);
    const fetch = queuedFetch(mutationResult('cartCreate', created), mutationResult('cartLinesUpdate', created));
    const adapter = adapterWith(fetch);
    const cart = new Cart('EUR');
    cart.addItem(product(1), new Quantity(1));
    await adapter.save(cart);
    cart.setQuantity(pid(1), new Quantity(2));
    await adapter.save(cart);
    for (const call of [0, 1]) {
      const request = sentRequest(fetch, call);
      expect(request.query).toMatch(/^\s*mutation \w+\([^)]*\) @inContext\(country: ES, language: ES\) \{/);
      expect(request.init.cache).toBe('no-store');
      expect(request.init.next).toBeUndefined();
    }
  });

  it('bumps the cart revision after each save that changed the remote cart, for other tabs', async () => {
    const created = cartNode('cart-new', [{ lineId: 'l1', variant: 1, quantity: 1 }]);
    const updated = cartNode('cart-new', [{ lineId: 'l1', variant: 1, quantity: 2 }]);
    const fetch = queuedFetch(mutationResult('cartCreate', created), mutationResult('cartLinesUpdate', updated));
    const adapter = adapterWith(fetch);
    const cart = new Cart('EUR');
    cart.addItem(product(1), new Quantity(1));

    await adapter.save(cart);
    const first = storage.getItem(SHOPIFY_CART_REVISION_KEY);
    expect(first).not.toBeNull();

    cart.addItem(product(1), new Quantity(1));
    await adapter.save(cart);
    const second = storage.getItem(SHOPIFY_CART_REVISION_KEY);
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);

    // Nothing to send: no new revision.
    await adapter.save(cart);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(storage.getItem(SHOPIFY_CART_REVISION_KEY)).toBe(second);
  });

  it('does not bump the revision for a load or a failed save, but does after a partial one', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    const remote = cartNode('cart-1', [
      { lineId: 'l1', variant: 1, quantity: 1 },
      { lineId: 'l2', variant: 2, quantity: 1 },
    ]);
    const fetch = queuedFetch(
      { data: { cart: remote } },
      mutationResult('cartLinesRemove', null, [{ message: 'Cart is locked' }]),
      mutationResult('cartLinesRemove', cartNode('cart-1', [{ lineId: 'l1', variant: 1, quantity: 1 }])),
      mutationResult('cartLinesUpdate', null, [{ message: 'Too many' }]),
    );
    const adapter = adapterWith(fetch);
    const cart = await adapter.load();
    expect(storage.getItem(SHOPIFY_CART_REVISION_KEY)).toBeNull();

    cart.deleteItem(pid(2));
    await expect(adapter.save(cart)).rejects.toThrow('Cart is locked');
    expect(storage.getItem(SHOPIFY_CART_REVISION_KEY)).toBeNull();

    cart.setQuantity(pid(1), new Quantity(3));
    await expect(adapter.save(cart)).rejects.toThrow('Too many');
    // The removal went through before the update failed.
    expect(storage.getItem(SHOPIFY_CART_REVISION_KEY)).not.toBeNull();
  });

  it('clear forgets the cart id', async () => {
    storage.setItem(SHOPIFY_CART_ID_KEY, 'cart-1');
    await adapterWith(queuedFetch()).clear();
    expect(storage.getItem(SHOPIFY_CART_ID_KEY)).toBeNull();
  });

  it('works without storage (server rendering): empty cart, no requests', async () => {
    const fetch = queuedFetch();
    const adapter = new ShopifyCartAdapter(testClient(fetch), new ShopifyCartIdStore(null), 'EUR');
    expect((await adapter.load()).isEmpty()).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
});
