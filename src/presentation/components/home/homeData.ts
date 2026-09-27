import type { Product } from "@/domain/entities/product/Product";

import { looseProductsIn } from "@/application/catalog";
import type { NavData, NavKit } from "@/presentation/components/layout/navigation";

/** Loose products on the home page (two rows of the four-column grid). */
export const FEATURED_LIMIT = 8;

/**
 * The product the home page leads with: the kit with the most listed contents,
 * preferring featured products. Data-driven so it works with any catalog backend.
 */
export function pickFlagship(products: readonly Product[]): Product | null {
  const contentsCount = (product: Product) => product.details?.contents.length ?? 0;
  const kits = products.filter((product) => product.inStock && contentsCount(product) > 0);
  const pool = kits.some((product) => product.isFeatured()) ? kits.filter((product) => product.isFeatured()) : kits;
  return pool.reduce<Product | null>(
    (best, product) =>
      !best ||
      contentsCount(product) > contentsCount(best) ||
      (contentsCount(product) === contentsCount(best) && product.price.greaterThan(best.price))
        ? product
        : best,
    null,
  );
}

/**
 * The kits for the hero's calls to action: the flagship kit (the one "Compra ahora" opens, the Kit 72h) first, so
 * it gets the primary button, then the others in catalog order.
 */
export function heroKits({ kits, flagshipSlug }: NavData): NavKit[] {
  const flagship = kits.find((kit) => kit.slug === flagshipSlug);
  return flagship ? [flagship, ...kits.filter((kit) => kit !== flagship)] : [...kits];
}

/** Loose products (not kits) for "Completa o renueva tu kit": featured ones first, in catalog order. */
export function pickFeatured(products: readonly Product[], limit = FEATURED_LIMIT): Product[] {
  const loose = looseProductsIn(products);
  return [...loose.filter((product) => product.isFeatured()), ...loose.filter((product) => !product.isFeatured())].slice(
    0,
    limit,
  );
}

export interface ReviewSummary {
  /** Review-count-weighted average across products with reviews. */
  average: number;
  count: number;
}

/** Aggregate of real review data across the catalog, or null when no product has reviews. */
export function summarizeReviews(products: readonly Product[]): ReviewSummary | null {
  let count = 0;
  let weighted = 0;
  for (const product of products) {
    if (!product.hasReviews() || !product.rating) continue;
    count += product.rating.count;
    weighted += product.rating.average * product.rating.count;
  }
  return count > 0 ? { average: weighted / count, count } : null;
}
