import { findByVariantId } from '@/application/catalog/kits';
import { CartRepository } from '@/application/ports/CartRepository';
import { ProductRepository } from '@/application/ports/ProductRepository';
import { Cart, MAX_QUANTITY_PER_ITEM } from '@/domain/entities/cart/Cart';
import { CurrencyCode } from '@/domain/value-objects/Money';
import { Quantity } from '@/domain/value-objects/Quantity';
import { KeyValueStorage, browserStorage } from '@/infrastructure/adapters/storage';

export const CART_STORAGE_KEY = 'bugout.cart';
/** Key and format written by the first version of the store: `{ items: [{ product: { id, ... }, quantity }] }`. */
export const LEGACY_CART_STORAGE_KEY = 'shopping-cart';

interface StoredLine {
  productId: string;
  quantity: number;
}

interface StoredCart {
  version: 2;
  items: StoredLine[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toLine(productId: unknown, quantity: unknown): StoredLine | null {
  if (typeof productId !== 'string' || productId.trim() === '') return null;
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 1) return null;
  return { productId, quantity: Math.min(Math.floor(quantity), MAX_QUANTITY_PER_ITEM) };
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseItems(data: unknown, readLine: (item: Record<string, unknown>) => StoredLine | null): StoredLine[] {
  if (!isRecord(data) || !Array.isArray(data.items)) return [];
  return data.items.flatMap((item) => (isRecord(item) ? (readLine(item) ?? []) : []));
}

const readV2Line = (item: Record<string, unknown>) => toLine(item.productId, item.quantity);
const readLegacyLine = (item: Record<string, unknown>) =>
  isRecord(item.product) ? toLine(item.product.id, item.quantity) : null;

/**
 * Cart persisted in localStorage as product ids and quantities only. Products are
 * re-read from the catalog on load, so stored prices or stock can never be trusted.
 */
export class LocalStorageCartAdapter implements CartRepository {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly currency: CurrencyCode,
    private readonly storage?: KeyValueStorage | null,
    private readonly key: string = CART_STORAGE_KEY,
  ) {}

  async load(): Promise<Cart> {
    const cart = new Cart(this.currency);
    const storage = this.resolveStorage();
    if (!storage) return cart;
    try {
      const lines = this.readLines(storage);
      if (lines.length === 0) return cart;
      const products = await this.productRepository.findAll();
      for (const line of lines) {
        const product = findByVariantId(products, line.productId);
        if (!product) continue;
        try {
          cart.addItem(product, new Quantity(Math.min(line.quantity, MAX_QUANTITY_PER_ITEM - cart.quantityOf(product.id))));
        } catch {
          // Out of stock, wrong currency or already at the limit: drop the line.
        }
      }
      return cart;
    } catch (error) {
      console.warn('[cart] Could not restore the saved cart', error);
      return new Cart(this.currency);
    }
  }

  async save(cart: Cart): Promise<void> {
    this.resolveStorage()?.setItem(this.key, JSON.stringify(this.serialize(cart)));
  }

  async clear(): Promise<void> {
    this.resolveStorage()?.removeItem(this.key);
  }

  private serialize(cart: Cart): StoredCart {
    return {
      version: 2,
      items: cart.getItems().map((item) => ({ productId: item.product.id.value, quantity: item.quantity.value })),
    };
  }

  /** Reads the current format, migrating (and deleting) the legacy one when that is all there is. */
  private readLines(storage: KeyValueStorage): StoredLine[] {
    const current = storage.getItem(this.key);
    const legacy = storage.getItem(LEGACY_CART_STORAGE_KEY);
    if (legacy !== null) storage.removeItem(LEGACY_CART_STORAGE_KEY);
    if (current !== null) {
      const data = parseJson(current);
      return isRecord(data) && data.version === 2 ? parseItems(data, readV2Line) : [];
    }
    if (legacy === null) return [];

    const migrated = parseItems(parseJson(legacy), readLegacyLine);
    const stored: StoredCart = { version: 2, items: migrated };
    storage.setItem(this.key, JSON.stringify(stored));
    return migrated;
  }

  private resolveStorage(): KeyValueStorage | null {
    return this.storage === undefined ? browserStorage() : this.storage;
  }
}
