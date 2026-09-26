import { Product, ProductDetails, ProductImage, ProductRating } from '@/domain/entities/product/Product';
import { CurrencyCode, Money } from '@/domain/value-objects/Money';
import { ProductId } from '@/domain/value-objects/ProductId';

type JsonObject = Record<string, unknown>;

class CatalogFormatError extends Error {
  constructor(path: string, problem: string) {
    super(`Invalid product catalog at ${path}: ${problem}`);
    this.name = 'CatalogFormatError';
  }
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Typed field access that reports the JSON path of the first problem it finds. */
class Fields {
  constructor(
    private readonly value: JsonObject,
    readonly path: string,
  ) {}

  static of(value: unknown, path: string): Fields {
    if (!isObject(value)) throw new CatalogFormatError(path, 'expected an object');
    return new Fields(value, path);
  }

  string(key: string): string {
    const value = this.value[key];
    if (typeof value !== 'string') throw new CatalogFormatError(`${this.path}.${key}`, 'expected a string');
    return value;
  }

  number(key: string): number {
    const value = this.value[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new CatalogFormatError(`${this.path}.${key}`, 'expected a number');
    }
    return value;
  }

  boolean(key: string): boolean {
    const value = this.value[key];
    if (typeof value !== 'boolean') throw new CatalogFormatError(`${this.path}.${key}`, 'expected a boolean');
    return value;
  }

  optional<T>(key: string, read: (fields: Fields, key: string) => T): T | null {
    const value = this.value[key];
    return value === undefined || value === null ? null : read(this, key);
  }

  object(key: string): Fields {
    return Fields.of(this.value[key], `${this.path}.${key}`);
  }

  array<T>(key: string, read: (item: unknown, path: string) => T): T[] {
    const value = this.value[key];
    if (!Array.isArray(value)) throw new CatalogFormatError(`${this.path}.${key}`, 'expected an array');
    return value.map((item, index) => read(item, `${this.path}.${key}[${index}]`));
  }
}

function parseImage(value: unknown, path: string): ProductImage {
  const fields = Fields.of(value, path);
  return {
    url: fields.string('url'),
    alt: fields.string('alt'),
    width: fields.optional('width', (f, k) => f.number(k)) ?? undefined,
    height: fields.optional('height', (f, k) => f.number(k)) ?? undefined,
  };
}

function parseRating(fields: Fields): ProductRating {
  return { average: fields.number('average'), count: fields.number('count') };
}

function parseString(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new CatalogFormatError(path, 'expected a string');
  return value;
}

function parseDetails(fields: Fields): ProductDetails {
  return {
    longDescription: fields.optional('longDescription', (f, k) => f.string(k)) ?? undefined,
    features: fields.array('features', parseString),
    specifications: fields.array('specifications', (item, path) => {
      const spec = Fields.of(item, path);
      return { label: spec.string('label'), value: spec.string('value') };
    }),
    contents: fields.array('contents', (item, path) => {
      const content = Fields.of(item, path);
      return { item: content.string('item'), quantity: content.string('quantity') };
    }),
  };
}

function parseProduct(value: unknown, path: string, currency: CurrencyCode): Product {
  const fields = Fields.of(value, path);
  try {
    return Product.create({
      id: new ProductId(fields.string('id')),
      slug: fields.string('slug'),
      name: fields.string('name'),
      description: fields.string('description'),
      price: Money.fromMajor(fields.number('price'), currency),
      originalPrice: fields.optional('originalPrice', (f, k) => Money.fromMajor(f.number(k), currency)),
      category: fields.string('category'),
      inStock: fields.boolean('inStock'),
      badge: fields.optional('badge', (f, k) => f.string(k)),
      featured: fields.boolean('featured'),
      rating: fields.optional('rating', (f, k) => parseRating(f.object(k))),
      images: fields.array('images', parseImage),
      details: fields.optional('details', (f, k) => parseDetails(f.object(k))),
    });
  } catch (error) {
    if (error instanceof CatalogFormatError) throw error;
    throw new CatalogFormatError(path, error instanceof Error ? error.message : String(error));
  }
}

/**
 * Validates raw catalog JSON and maps it to Products priced in `currency`.
 * @throws Error describing the first malformed field, e.g. "products[2].price: expected a number"
 */
export function parseCatalog(data: unknown, currency: CurrencyCode): Product[] {
  if (!Array.isArray(data)) throw new CatalogFormatError('products', 'expected an array');
  const products = data.map((item, index) => parseProduct(item, `products[${index}]`, currency));
  const seen = new Set<string>();
  for (const product of products) {
    for (const key of [`id:${product.id.value}`, `slug:${product.slug}`]) {
      if (seen.has(key)) throw new CatalogFormatError('products', `duplicate ${key.replace(':', ' ')}`);
      seen.add(key);
    }
  }
  return products;
}
