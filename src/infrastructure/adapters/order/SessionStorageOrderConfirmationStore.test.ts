import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LAST_ORDER_STORAGE_KEY,
  SessionStorageOrderConfirmationStore,
  parseStoredOrder,
  serializeOrder,
} from './SessionStorageOrderConfirmationStore';
import { OrderConfirmation } from '@/application/dtos/Order';
import { Money } from '@/domain/value-objects/Money';
import { MemoryStorage } from '@/infrastructure/testing/MemoryStorage';

const eur = (minor: number) => Money.fromMinor(minor, 'EUR');

const confirmation: OrderConfirmation = {
  orderNumber: 'BUG-7K2Q9XA1',
  placedAt: '2026-09-26T10:00:00.000Z',
  email: 'ana@example.es',
  lines: [
    { productId: 'kit', name: 'Kit 24H', quantity: 2, unitPriceMinor: 3900, subtotalMinor: 7800 },
    { productId: 'agua', name: 'Purificador', quantity: 1, unitPriceMinor: 4500, subtotalMinor: 4500 },
  ],
  totals: { subtotal: eur(12300), shipping: eur(0), tax: eur(2135), total: eur(12300) },
  shippingMethod: 'standard',
};

const stored = () => JSON.parse(serializeOrder(confirmation)) as Record<string, unknown> & {
  lines: Array<Record<string, unknown>>;
  totals: Record<string, { minor: number; currency: string }>;
};
const parse = (value: unknown) => parseStoredOrder(JSON.stringify(value));

describe('parseStoredOrder / serializeOrder', () => {
  it('round-trips a confirmation with Money stored as minor units and currency', () => {
    expect(stored().totals.total).toEqual({ minor: 12300, currency: 'EUR' });
    const restored = parseStoredOrder(serializeOrder(confirmation));
    expect(restored).toEqual(confirmation);
    expect(restored?.totals.total).toBeInstanceOf(Money);
    expect(restored?.totals.tax.equals(eur(2135))).toBe(true);
  });

  it('accepts every shipping method and totals with tax added on top', () => {
    for (const shippingMethod of ['standard', 'express', 'overnight']) {
      expect(parse({ ...stored(), shippingMethod })?.shippingMethod).toBe(shippingMethod);
    }
    const totals = { subtotal: { minor: 12300, currency: 'EUR' }, shipping: { minor: 995, currency: 'EUR' }, tax: { minor: 2792, currency: 'EUR' }, total: { minor: 16087, currency: 'EUR' } };
    expect(parse({ ...stored(), totals })?.totals.total.equals(eur(16087))).toBe(true);
  });

  it('keeps only known fields', () => {
    const value = stored();
    const restored = parse({ ...value, injected: '<script>', lines: [{ ...value.lines[0], extra: 1 }, value.lines[1]] });
    expect(restored).not.toHaveProperty('injected');
    expect(restored?.lines[0]).not.toHaveProperty('extra');
  });

  it('rejects missing, malformed or non-object values', () => {
    for (const raw of [null, '', 'not json', '{}', '[]', 'null', '42', '"order"']) {
      expect(parseStoredOrder(raw)).toBeNull();
    }
  });

  it.each([
    ['an unknown shipping method', { shippingMethod: 'teleport' }],
    ['an empty order number', { orderNumber: '  ' }],
    ['a non-string email', { email: 42 }],
    ['an unparseable date', { placedAt: 'yesterday' }],
    ['no lines', { lines: [] }],
    ['lines that are not an array', { lines: {} }],
    ['missing totals', { totals: undefined }],
  ])('rejects %s', (_, patch) => {
    expect(parse({ ...stored(), ...patch })).toBeNull();
  });

  it.each([
    ['a zero quantity', { quantity: 0, subtotalMinor: 0 }],
    ['a fractional quantity', { quantity: 1.5, subtotalMinor: 5850 }],
    ['a negative price', { unitPriceMinor: -3900, subtotalMinor: -7800 }],
    ['a fractional price', { unitPriceMinor: 39.5, subtotalMinor: 79 }],
    ['a subtotal that is not price × quantity', { subtotalMinor: 100 }],
    ['an empty product id', { productId: '' }],
    ['a missing name', { name: undefined }],
  ])('rejects a line with %s', (_, patch) => {
    const value = stored();
    expect(parse({ ...value, lines: [{ ...value.lines[0], ...patch }, value.lines[1]] })).toBeNull();
  });

  it.each([
    ['a negative amount', { total: { minor: -1, currency: 'EUR' } }],
    ['a fractional amount', { tax: { minor: 1.5, currency: 'EUR' } }],
    ['a malformed currency', { shipping: { minor: 0, currency: 'euro' } }],
    ['mixed currencies', { shipping: { minor: 0, currency: 'USD' } }],
    ['a missing amount', { tax: undefined }],
    ['a subtotal that differs from the lines', { subtotal: { minor: 1, currency: 'EUR' } }],
    ['a total below subtotal plus shipping', { total: { minor: 100, currency: 'EUR' } }],
    ['tax above the total', { tax: { minor: 99999, currency: 'EUR' } }],
  ])('rejects totals with %s', (_, patch) => {
    const value = stored();
    expect(parse({ ...value, totals: { ...value.totals, ...patch } })).toBeNull();
  });
});

describe('SessionStorageOrderConfirmationStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves, loads and clears the last order under bugout.lastOrder', () => {
    const storage = new MemoryStorage();
    const store = new SessionStorageOrderConfirmationStore(storage);
    expect(store.load()).toBeNull();

    store.save(confirmation);
    expect(storage.json(LAST_ORDER_STORAGE_KEY)).toMatchObject({ orderNumber: 'BUG-7K2Q9XA1' });
    expect(store.load()).toEqual(confirmation);

    store.clear();
    expect(storage.getItem(LAST_ORDER_STORAGE_KEY)).toBeNull();
    expect(store.load()).toBeNull();
  });

  it('returns null for tampered stored data', () => {
    const storage = new MemoryStorage();
    storage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify({ ...stored(), shippingMethod: 'teleport' }));
    expect(new SessionStorageOrderConfirmationStore(storage).load()).toBeNull();
  });

  it('uses window.sessionStorage by default', () => {
    const sessionStorage = new MemoryStorage();
    vi.stubGlobal('window', { sessionStorage });
    new SessionStorageOrderConfirmationStore().save(confirmation);
    expect(sessionStorage.getItem(LAST_ORDER_STORAGE_KEY)).not.toBeNull();
  });

  it('does nothing and returns null on the server', () => {
    const store = new SessionStorageOrderConfirmationStore();
    expect(() => store.save(confirmation)).not.toThrow();
    expect(store.load()).toBeNull();
    expect(() => store.clear()).not.toThrow();
  });

  it('never throws when storage is blocked or full', () => {
    const throwing = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    const store = new SessionStorageOrderConfirmationStore(throwing);
    expect(() => store.save(confirmation)).not.toThrow();
    expect(store.load()).toBeNull();
    expect(() => store.clear()).not.toThrow();
  });
});
