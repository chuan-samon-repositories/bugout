// src/application/dtos/FilterCriteria.ts

export type SortOption = "featured" | "price-low" | "price-high" | "rating" | "reviews";

export interface FilterCriteria {
  category?: string;
  priceRange: { min: number; max: number };
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sortBy: SortOption;
}
