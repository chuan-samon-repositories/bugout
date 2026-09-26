import type { Product } from "@/domain/entities/product/Product";

export const FEATURED_LIMIT = 3;

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

/** Featured products, or the first few when none are flagged. */
export function pickFeatured(products: readonly Product[], limit = FEATURED_LIMIT): Product[] {
  const featured = products.filter((product) => product.isFeatured());
  return (featured.length > 0 ? featured : products).slice(0, limit);
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
