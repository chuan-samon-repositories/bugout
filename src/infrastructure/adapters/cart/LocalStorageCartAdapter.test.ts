import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_STORAGE_KEY, LEGACY_CART_STORAGE_KEY, LocalStorageCartAdapter } from './LocalStorageCartAdapter';
import { MemoryStorage } from '@/infrastructure/testing/MemoryStorage';
import { InMemoryProductRepository } from '@/application/testing/fakes';
import { buildProduct } from '@/domain/testing/buildProduct';
import { Cart } from '@/domain/entities/cart/Cart';
import { ProductId } from '@/domain/value-objects/ProductId';
import { Quantity } from '@/domain/value-objects/Quantity';

const id = (value: string) => new ProductId(value);

describe('LocalStorageCartAdapter', () => {
  let storage: MemoryStorage;
  let catalog: InMemoryProductRepository;
  let adapter: LocalStorageCartAdapter;

  beforeEach(() => {
    storage = new MemoryStorage();
    catalog = new InMemoryProductRepository([
      buildProduct({ id: 'kit', price: 199 }),
      buildProduct({ id: 'food', price: 49 }),
      buildProduct({ id: 'sold-out', inStock: false }),
    ]);
    adapter = new LocalStorageCartAdapter(catalog, 'EUR', storage);
  });

  const store = (key: string, value: unknown) => storage.setItem(key, JSON.stringify(value));

  it('returns an empty cart in the store currency when nothing is stored', async () => {
    const cart = await adapter.load();
    expect(cart.isEmpty()).toBe(true);
    expect(cart.currency).toBe('EUR');
  });

  it('returns an empty cart without storage (server rendering)', async () => {
    const serverAdapter = new LocalStorageCartAdapter(catalog, 'EUR', null);
    expect((await serverAdapter.load()).isEmpty()).toBe(true);
    await expect(serverAdapter.save(new Cart('EUR'))).resolves.toBeUndefined();
    await expect(serverAdapter.clear()).resolves.toBeUndefined();
  });

  it('falls back to an empty cart when there is no window', async () => {
    const defaultAdapter = new LocalStorageCartAdapter(catalog, 'EUR');
    expect((await defaultAdapter.load()).isEmpty()).toBe(true);
  });

  it('saves only ids and quantities, and restores them', async () => {
    const cart = new Cart('EUR');
    cart.addItem(await catalog.findById(id('kit')), new Quantity(2));
    cart.addItem(await catalog.findById(id('food')), new Quantity(1));
    await adapter.save(cart);

    expect(storage.json(CART_STORAGE_KEY)).toEqual({
      version: 2,
      items: [
        { productId: 'kit', quantity: 2 },
        { productId: 'food', quantity: 1 },
      ],
    });
    const restored = await adapter.load();
    expect(restored.quantityOf(id('kit'))).toBe(2);
    expect(restored.totalAmount().minor).toBe(44700);
  });

  it('restores each kit variant as its own line, priced from that variant', async () => {
    const kit = buildProduct({
      id: 'kit-72h',
      variants: [
        { id: 'kit-72h-1p', title: '1 persona', price: 119 },
        { id: 'kit-72h-2p', title: '2 personas', price: 199 },
      ],
    });
    const withKit = new LocalStorageCartAdapter(new InMemoryProductRepository([kit]), 'EUR', storage);
    store(CART_STORAGE_KEY, {
      version: 2,
      items: [
        { productId: 'kit-72h-2p', quantity: 1 },
        { productId: 'kit-72h-1p', quantity: 2 },
      ],
    });
    const cart = await withKit.load();
    expect(cart.getItems().map((item) => [item.product.displayName, item.quantity.value])).toEqual([
      ['Producto de prueba · 2 personas', 1],
      ['Producto de prueba · 1 persona', 2],
    ]);
    expect(cart.totalAmount().amount).toBe(199 + 2 * 119);
  });

  it('ignores a tampered price and uses the catalog price', async () => {
    store(CART_STORAGE_KEY, { version: 2, items: [{ productId: 'kit', quantity: 1, price: 0.01, product: { price: 0.01 } }] });
    const cart = await adapter.load();
    expect(cart.totalAmount().minor).toBe(19900);
  });

  it('re-prices from the current catalog', async () => {
    store(CART_STORAGE_KEY, { version: 2, items: [{ productId: 'kit', quantity: 1 }] });
    catalog.products = [buildProduct({ id: 'kit', price: 150 })];
    expect((await adapter.load()).totalAmount().minor).toBe(15000);
  });

  it('skips unknown products, now out-of-stock products and malformed lines', async () => {
    store(CART_STORAGE_KEY, {
      version: 2,
      items: [
        { productId: 'kit', quantity: 1 },
        { productId: 'discontinued', quantity: 1 },
        { productId: 'sold-out', quantity: 1 },
        { productId: 'food', quantity: 0 },
        { productId: 'food', quantity: 'two' },
        { productId: '', quantity: 1 },
        null,
        'food',
      ],
    });
    const cart = await adapter.load();
    expect(cart.getItems().map((item) => item.product.id.value)).toEqual(['kit']);
  });

  it('clamps quantities to the per-item limit, including duplicated lines', async () => {
    store(CART_STORAGE_KEY, {
      version: 2,
      items: [
        { productId: 'kit', quantity: 500 },
        { productId: 'food', quantity: 60 },
        { productId: 'food', quantity: 60 },
      ],
    });
    const cart = await adapter.load();
    expect(cart.quantityOf(id('kit'))).toBe(99);
    expect(cart.quantityOf(id('food'))).toBe(99);
  });

  it.each([
    ['corrupt JSON', '{not json'],
    ['a non-object', '42'],
    ['a missing items array', JSON.stringify({ version: 2 })],
    ['an unknown version', JSON.stringify({ version: 3, items: [{ productId: 'kit', quantity: 1 }] })],
  ])('returns an empty cart for %s', async (_label, raw) => {
    storage.setItem(CART_STORAGE_KEY, raw);
    expect((await adapter.load()).isEmpty()).toBe(true);
  });

  it('migrates the legacy format and deletes the old key', async () => {
    store(LEGACY_CART_STORAGE_KEY, {
      items: [
        { product: { id: 'kit', name: 'Old name', price: { amount: 1 } }, quantity: 3 },
        { product: { id: 'discontinued' }, quantity: 1 },
        { quantity: 1 },
      ],
    });
    const cart = await adapter.load();
    expect(cart.quantityOf(id('kit'))).toBe(3);
    expect(cart.totalAmount().minor).toBe(59700);
    expect(storage.getItem(LEGACY_CART_STORAGE_KEY)).toBeNull();
    expect(storage.json(CART_STORAGE_KEY)).toEqual({
      version: 2,
      items: [
        { productId: 'kit', quantity: 3 },
        { productId: 'discontinued', quantity: 1 },
      ],
    });
  });

  it('prefers the current format and drops a leftover legacy key', async () => {
    store(CART_STORAGE_KEY, { version: 2, items: [{ productId: 'food', quantity: 1 }] });
    store(LEGACY_CART_STORAGE_KEY, { items: [{ product: { id: 'kit' }, quantity: 1 }] });
    const cart = await adapter.load();
    expect(cart.getItems().map((item) => item.product.id.value)).toEqual(['food']);
    expect(storage.getItem(LEGACY_CART_STORAGE_KEY)).toBeNull();
  });

  it('treats corrupt legacy data as an empty cart', async () => {
    storage.setItem(LEGACY_CART_STORAGE_KEY, '[[[');
    expect((await adapter.load()).isEmpty()).toBe(true);
    expect(storage.getItem(LEGACY_CART_STORAGE_KEY)).toBeNull();
  });

  it('never throws from load, even when storage or the catalog fail', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = new MemoryStorage();
    broken.getItem = () => {
      throw new Error('SecurityError');
    };
    expect((await new LocalStorageCartAdapter(catalog, 'EUR', broken).load()).isEmpty()).toBe(true);

    store(CART_STORAGE_KEY, { version: 2, items: [{ productId: 'kit', quantity: 1 }] });
    catalog.findAll = () => Promise.reject(new Error('offline'));
    expect((await adapter.load()).isEmpty()).toBe(true);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('clear removes the stored cart', async () => {
    store(CART_STORAGE_KEY, { version: 2, items: [{ productId: 'kit', quantity: 1 }] });
    await adapter.clear();
    expect(storage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it('supports a custom key', async () => {
    const custom = new LocalStorageCartAdapter(catalog, 'EUR', storage, 'custom.cart');
    const cart = new Cart('EUR');
    cart.addItem(await catalog.findById(id('kit')), new Quantity(1));
    await custom.save(cart);
    expect(storage.getItem('custom.cart')).not.toBeNull();
    expect(storage.getItem(CART_STORAGE_KEY)).toBeNull();
  });
});
