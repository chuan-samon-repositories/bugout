import { Product } from '@/domain/entities/product/Product';

export interface CategorySummary {
  slug: string;
  count: number;
}

/** Product count per category, in first-seen order. Pass the unfiltered list so counts don't depend on active filters. */
export function summarizeCategories(products: readonly Product[]): CategorySummary[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }
  return Array.from(counts, ([slug, count]) => ({ slug, count }));
}

/**
 * Price range of the list across every variant, in whole major units (the cheapest
 * variant floored, the dearest ceiled), or null when empty.
 */
export function priceBounds(products: readonly Product[]): { min: number; max: number } | null {
  if (products.length === 0) return null;
  const ranges = products.map((product) => product.priceRange());
  return {
    min: Math.floor(Math.min(...ranges.map(({ min }) => min.amount))),
    max: Math.ceil(Math.max(...ranges.map(({ max }) => max.amount))),
  };
}
