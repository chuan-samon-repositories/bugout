import { Product, type ProductDetails, type ProductImage, type ProductRating } from "@/domain/entities/product/Product";
import { Money } from "@/domain/value-objects/Money";
import { ProductId } from "@/domain/value-objects/ProductId";

interface MoneySnapshot {
  minor: number;
  currency: string;
}

/**
 * Plain, serialisable copy of a Product. Server Components pass this to Client
 * Components (class instances cannot cross that boundary), which rebuild the entity.
 */
export interface ProductSnapshot {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: MoneySnapshot;
  originalPrice: MoneySnapshot | null;
  category: string;
  inStock: boolean;
  badge: string | null;
  featured: boolean;
  rating: ProductRating | null;
  images: ProductImage[];
  details: ProductDetails | null;
}

const toMoneySnapshot = (money: Money): MoneySnapshot => ({ minor: money.minor, currency: money.currency });

export function toProductSnapshot(product: Product): ProductSnapshot {
  return {
    id: product.id.value,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: toMoneySnapshot(product.price),
    originalPrice: product.originalPrice ? toMoneySnapshot(product.originalPrice) : null,
    category: product.category,
    inStock: product.inStock,
    badge: product.badge,
    featured: product.featured,
    rating: product.rating ? { ...product.rating } : null,
    images: product.images.map((image) => ({ ...image })),
    details: product.details
      ? {
          ...product.details,
          features: [...product.details.features],
          specifications: product.details.specifications.map((spec) => ({ ...spec })),
          contents: product.details.contents.map((item) => ({ ...item })),
        }
      : null,
  };
}

export function fromProductSnapshot(snapshot: ProductSnapshot): Product {
  return Product.create({
    ...snapshot,
    id: new ProductId(snapshot.id),
    price: Money.fromMinor(snapshot.price.minor, snapshot.price.currency),
    originalPrice: snapshot.originalPrice
      ? Money.fromMinor(snapshot.originalPrice.minor, snapshot.originalPrice.currency)
      : null,
  });
}
