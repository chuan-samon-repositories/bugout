import { Cart } from '@/domain/entities/cart/Cart';
import { Product } from '@/domain/entities/product/Product';
import { NotFoundError } from '@/domain/errors';
import { ProductId } from '@/domain/value-objects/ProductId';
import { Quantity } from '@/domain/value-objects/Quantity';
import { CartRepository } from '../ports/CartRepository';
import { ProductRepository } from '../ports/ProductRepository';

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

/** Stores a snapshot and returns a fresh Cart on every load, like a real repository. */
export class InMemoryCartRepository implements CartRepository {
  private lines: Array<{ product: Product; quantity: number }> = [];
  saves = 0;

  constructor(private readonly currency = 'EUR') {}

  async load(): Promise<Cart> {
    const cart = new Cart(this.currency);
    this.lines.forEach(({ product, quantity }) => cart.addItem(product, new Quantity(quantity)));
    return cart;
  }

  async save(cart: Cart): Promise<void> {
    this.saves += 1;
    this.lines = cart.getItems().map((item) => ({ product: item.product, quantity: item.quantity.value }));
  }

  async clear(): Promise<void> {
    this.lines = [];
  }
}
