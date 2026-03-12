export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  description: string;
  category: string;
  featured: boolean;
  inStock: boolean;
  badge?: string;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface SortOption {
  id: string;
  name: string;
}

export interface FilterState {
  selectedCategory: string;
  sortBy: string;
  priceRange: [number, number];
  inStock?: boolean;
  onSale?: boolean;
  freeShipping?: boolean;
}
