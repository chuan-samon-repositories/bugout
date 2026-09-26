export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'reviews';

export const SORT_OPTIONS: readonly SortOption[] = ['featured', 'price-asc', 'price-desc', 'rating', 'reviews'];

export interface FilterCriteria {
  /** Category slug; undefined means all categories. */
  category?: string;
  /** Inclusive bounds in major currency units; undefined means unbounded. */
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sortBy: SortOption;
}
