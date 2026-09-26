import type { Product } from "@/domain/entities/product/Product";

/** The product the home page leads with. */
export const FLAGSHIP_SLUG = "72h-survival-backpack";
export const FEATURED_LIMIT = 3;

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
