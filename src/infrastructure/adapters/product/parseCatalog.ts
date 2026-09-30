import {
  ACTION_CARD_DECKS,
  isActionCardDeck,
  Product,
  type KitInfo,
  type ProductDetails,
  type ProductImage,
  type ProductRating,
  type ProductSeo,
  type ProductVariant,
} from '@/domain/entities/product/Product';
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

  has(key: string): boolean {
    return this.value[key] !== undefined && this.value[key] !== null;
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
      const productSlug = content.optional('productSlug', (f, k) => f.string(k));
      return {
        item: content.string('item'),
        quantity: content.string('quantity'),
        ...(productSlug ? { productSlug } : {}),
      };
    }),
    ...(fields.has('kit') ? { kit: parseKit(fields.object('kit')) } : {}),
    ...(fields.has('related') ? { related: fields.array('related', parseString) } : {}),
  };
}

function parseKit(fields: Fields): KitInfo {
  const idealFor = fields.optional('idealFor', (f, k) => f.string(k));
  const buildYourOwn = fields.optional('buildYourOwn', (f, k) => f.boolean(k));
  const actionCards = fields.optional('actionCards', (f, k) => {
    const value = f.string(k);
    if (!isActionCardDeck(value)) {
      throw new CatalogFormatError(`${f.path}.${k}`, `expected one of ${ACTION_CARD_DECKS.join(', ')}`);
    }
    return value;
  });
  return {
    label: fields.string('label'),
    ...(idealFor ? { idealFor } : {}),
    ...(buildYourOwn ? { buildYourOwn } : {}),
    ...(actionCards ? { actionCards } : {}),
  };
}

/** `seo.title` / `seo.description`, both optional; blank values count as unset. */
function parseSeo(fields: Fields): ProductSeo | null {
  const title = fields.optional('title', (f, k) => f.string(k))?.trim();
  const description = fields.optional('description', (f, k) => f.string(k))?.trim();
  if (!title && !description) return null;
  return { ...(title ? { title } : {}), ...(description ? { description } : {}) };
}

function parseVariant(value: unknown, path: string, currency: CurrencyCode): ProductVariant {
  const fields = Fields.of(value, path);
  const title = fields.string('title');
  return {
    id: new ProductId(fields.string('id')),
    title,
    options: fields.has('options')
      ? fields.array('options', (item, optionPath) => {
          const option = Fields.of(item, optionPath);
          return { name: option.string('name'), value: option.string('value') };
        })
      : [],
    price: Money.fromMajor(fields.number('price'), currency),
    originalPrice: fields.optional('originalPrice', (f, k) => Money.fromMajor(f.number(k), currency)),
    inStock: fields.boolean('inStock'),
  };
}

function parseProduct(value: unknown, path: string, currency: CurrencyCode): Product {
  const fields = Fields.of(value, path);
  try {
    const base = {
      slug: fields.string('slug'),
      name: fields.string('name'),
      description: fields.string('description'),
      category: fields.string('category'),
      badge: fields.optional('badge', (f, k) => f.string(k)),
      featured: fields.boolean('featured'),
      rating: fields.optional('rating', (f, k) => parseRating(f.object(k))),
      images: fields.array('images', parseImage),
      details: fields.optional('details', (f, k) => parseDetails(f.object(k))),
      seo: fields.optional('seo', (f, k) => parseSeo(f.object(k))),
    };
    // A product with `variants` takes its ids, prices and stock from them.
    if (fields.has('variants')) {
      const variants = fields.array('variants', (item, variantPath) => parseVariant(item, variantPath, currency));
      return Product.fromVariants(base, variants);
    }
    return Product.create({
      ...base,
      id: new ProductId(fields.string('id')),
      price: Money.fromMajor(fields.number('price'), currency),
      originalPrice: fields.optional('originalPrice', (f, k) => Money.fromMajor(f.number(k), currency)),
      inStock: fields.boolean('inStock'),
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
    const keys = [...product.variants.map((variant) => `id:${variant.id.value}`), `slug:${product.slug}`];
    for (const key of keys) {
      if (seen.has(key)) throw new CatalogFormatError('products', `duplicate ${key.replace(':', ' ')}`);
      seen.add(key);
    }
  }
  products.forEach((product, index) => checkReferences(product, `products[${index}]`, seen));
  return products;
}

/** Every slug a kit's contents or cross-sell points to must be in the catalog. */
function checkReferences(product: Product, path: string, seen: Set<string>): void {
  const details = product.details;
  if (!details) return;
  details.contents.forEach(({ productSlug }, index) => {
    if (productSlug && !seen.has(`slug:${productSlug}`)) {
      throw new CatalogFormatError(`${path}.details.contents[${index}].productSlug`, `unknown product ${productSlug}`);
    }
  });
  details.related?.forEach((slug, index) => {
    if (!seen.has(`slug:${slug}`)) {
      throw new CatalogFormatError(`${path}.details.related[${index}]`, `unknown product ${slug}`);
    }
  });
}
