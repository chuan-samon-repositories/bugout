import { Cart } from '@/domain/entities/cart/Cart';
import { Product } from '@/domain/entities/product/Product';
import { NotFoundError } from '@/domain/errors';
import { ProductId } from '@/domain/value-objects/ProductId';
import { Quantity } from '@/domain/value-objects/Quantity';
import type { CartNotice } from '@/application/dtos/Cart';
import { CartRepository } from '@/application/ports/CartRepository';
import { ProductRepository } from '@/application/ports/ProductRepository';

export class InMemoryProductRepository implements ProductRepository {
  constructor(public products: Product[] = []) {}

  async findAll(): Promise<Product[]> {
    return [...this.products];
  }

  async findById(id: ProductId): Promise<Product> {
    const product = this.products.find((candidate) => candidate.id.equals(id));
    if (!product) throw new NotFoundError(`Product ${id.value} not found`);
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = this.products.find((candidate) => candidate.slug === slug);
    if (!product) throw new NotFoundError(`Product ${slug} not found`);
    return product;
  }
}

/**
 * Stores a snapshot and returns a fresh Cart on every load, like a real repository.
 * `stock` simulates a backend that lowers quantities to what is available (0 drops the
 * line) on save, as Shopify does; `nextLoadNotices` is reported by the next load.
 */
export class InMemoryCartRepository implements CartRepository {
  private lines: Array<{ product: Product; quantity: number }> = [];
  private notices: readonly CartNotice[] = [];
  saves = 0;
  /** Units available per product id; products not listed are unlimited. */
  stock: Record<string, number> = {};
  nextLoadNotices: CartNotice[] = [];

  constructor(private readonly currency = 'EUR') {}

  async load(): Promise<Cart> {
    this.notices = this.nextLoadNotices;
    this.nextLoadNotices = [];
    return this.snapshot();
  }

  async save(cart: Cart): Promise<Cart> {
    this.saves += 1;
    this.lines = cart
      .getItems()
      .map((item) => ({ product: item.product, quantity: Math.min(item.quantity.value, this.stock[item.product.id.value] ?? Infinity) }))
      .filter((line) => line.quantity > 0);
    return this.snapshot();
  }

  async clear(): Promise<void> {
    this.lines = [];
  }

  loadNotices(): readonly CartNotice[] {
    return this.notices;
  }

  private snapshot(): Cart {
    const cart = new Cart(this.currency);
    this.lines.forEach(({ product, quantity }) => cart.addItem(product, new Quantity(quantity)));
    return cart;
  }
}
