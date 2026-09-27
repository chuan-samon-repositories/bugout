import { Product, ProductProps, type ProductVariant } from '@/domain/entities/product/Product';
import { Money } from '@/domain/value-objects/Money';
import { ProductId } from '@/domain/value-objects/ProductId';

export interface VariantOverrides {
  id: string;
  title: string;
  /** Major units. */
  price: number;
  originalPrice?: number | null;
  inStock?: boolean;
  /** Defaults to `[{ name: 'Personas', value: title }]`. */
  options?: ProductVariant['options'];
}

export interface ProductOverrides
  extends Partial<Omit<ProductProps, 'id' | 'price' | 'originalPrice' | 'variants'>> {
  id?: string;
  /** Major units. */
  price?: number;
  /** Major units; null for no previous price. */
  originalPrice?: number | null;
  currency?: string;
  /** Builds a multi-variant product; the first in-stock variant is selected. */
  variants?: VariantOverrides[];
}

/** Test helper: a valid product with sensible defaults. */
export function buildProduct(overrides: ProductOverrides = {}): Product {
  const { id = 'test-product', price = 100, originalPrice = null, currency = 'EUR', variants, ...rest } = overrides;
  const base = {
    slug: id,
    name: 'Producto de prueba',
    description: 'Descripción de prueba',
    category: 'survival-kits',
    inStock: true,
    badge: null,
    featured: false,
    rating: { average: 4.5, count: 10 },
    images: [],
    details: null,
    ...rest,
  };
  if (variants) {
    return Product.fromVariants(
      base,
      variants.map((variant) => ({
        id: new ProductId(variant.id),
        title: variant.title,
        options: variant.options ?? [{ name: 'Personas', value: variant.title }],
        price: Money.fromMajor(variant.price, currency),
        originalPrice:
          variant.originalPrice === undefined || variant.originalPrice === null
            ? null
            : Money.fromMajor(variant.originalPrice, currency),
        inStock: variant.inStock ?? true,
      })),
    );
  }
  return Product.create({
    ...base,
    id: new ProductId(id),
    price: Money.fromMajor(price, currency),
    originalPrice: originalPrice === null ? null : Money.fromMajor(originalPrice, currency),
  });
}
