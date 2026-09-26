import { Product, ProductProps } from '../entities/product/Product';
import { Money } from '../value-objects/Money';
import { ProductId } from '../value-objects/ProductId';

export interface ProductOverrides extends Partial<Omit<ProductProps, 'id' | 'price' | 'originalPrice'>> {
  id?: string;
  /** Major units. */
  price?: number;
  /** Major units; null for no previous price. */
  originalPrice?: number | null;
  currency?: string;
}

/** Test helper: a valid product with sensible defaults. */
export function buildProduct(overrides: ProductOverrides = {}): Product {
  const { id = 'test-product', price = 100, originalPrice = null, currency = 'EUR', ...rest } = overrides;
  return Product.create({
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
    id: new ProductId(id),
    price: Money.fromMajor(price, currency),
    originalPrice: originalPrice === null ? null : Money.fromMajor(originalPrice, currency),
  });
}
