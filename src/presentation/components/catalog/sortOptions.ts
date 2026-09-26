import { SORT_OPTIONS, type SortOption } from "@/application/dtos/FilterCriteria";
import type { Product } from "@/domain/entities/product/Product";

/** Sort options that only make sense when at least one product has review data. */
const REVIEW_SORTS: readonly SortOption[] = ["rating", "reviews"];

/**
 * Sort options worth offering for this catalog. Rating-based sorts are dropped when no product
 * has reviews (they would just return the catalog order); `selected` is always kept so a shared
 * URL such as `?sort=rating` still shows its value in the select.
 */
export function availableSortOptions(products: readonly Product[], selected?: SortOption): SortOption[] {
  if (products.some((product) => product.hasReviews())) return [...SORT_OPTIONS];
  return SORT_OPTIONS.filter((option) => !REVIEW_SORTS.includes(option) || option === selected);
}
