import { ProductRepository } from '@/application/ports/ProductRepository';
import { Product } from '@/domain/entities/product/Product';
import { NotFoundError } from '@/domain/errors';
import { CurrencyCode } from '@/domain/value-objects/Money';
import { ProductId } from '@/domain/value-objects/ProductId';
import catalog from '../../data/products.json';
import { parseCatalog } from './parseCatalog';

export interface JsonProductAdapterOptions {
  /** Store currency the catalog prices are expressed in. */
  currency: CurrencyCode;
  /** Raw catalog; defaults to the bundled `data/products.json`. */
  data?: unknown;
}

/** Catalog bundled with the app (local provider). Works on server and client without network access. */
export class JsonProductAdapter implements ProductRepository {
  private products: Product[] | null = null;

  constructor(private readonly options: JsonProductAdapterOptions) {}

  async findAll(): Promise<Product[]> {
    return [...this.load()];
  }

  async findById(id: ProductId): Promise<Product> {
    const product = this.load().find((candidate) => candidate.id.equals(id));
    if (!product) throw new NotFoundError(`Product ${id.value} not found`);
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = this.load().find((candidate) => candidate.slug === slug);
    if (!product) throw new NotFoundError(`Product with slug ${slug} not found`);
    return product;
  }

  private load(): Product[] {
    this.products ??= parseCatalog(this.options.data ?? catalog, this.options.currency);
    return this.products;
  }
}
