import { Product, Category, SortOption } from "../types";

export const generateCategories = (products: Product[]): Category[] => [
  { id: "all", name: "All Products", count: products.length },
  {
    id: "survival-kits",
    name: "Survival Kits",
    count: products.filter((p) => p.category === "survival-kits").length,
  },
  {
    id: "accessories",
    name: "Accessories",
    count: products.filter((p) => p.category === "accessories").length,
  },
];

export const sortOptions: SortOption[] = [
  { id: "featured", name: "Featured" },
  { id: "price-low", name: "Price: Low to High" },
  { id: "price-high", name: "Price: High to Low" },
  { id: "rating", name: "Highest Rated" },
  { id: "reviews", name: "Most Reviews" },
];
