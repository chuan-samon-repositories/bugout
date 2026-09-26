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

/** Price range of the list in whole major units (min floored, max ceiled), or null when empty. */
export function priceBounds(products: readonly Product[]): { min: number; max: number } | null {
  if (products.length === 0) return null;
  const amounts = products.map((product) => product.price.amount);
  return { min: Math.floor(Math.min(...amounts)), max: Math.ceil(Math.max(...amounts)) };
}
