import { useMemo } from "react";
import { Product, FilterState } from "../types";

export const useProductFilters = (
  products: Product[],
  filters: FilterState
) => {
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category filter
        if (
          filters.selectedCategory !== "all" &&
          product.category !== filters.selectedCategory
        ) {
          return false;
        }

        // Price range filter
        if (
          product.price < filters.priceRange[0] ||
          product.price > filters.priceRange[1]
        ) {
          return false;
        }

        // Quick filters
        if (filters.inStock && !product.inStock) {
          return false;
        }

        if (filters.onSale && !product.originalPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "price-low":
            return a.price - b.price;
          case "price-high":
            return b.price - a.price;
          case "rating":
            return b.rating - a.rating;
          case "reviews":
            return b.reviews - a.reviews;
          default:
            return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        }
      });
  }, [products, filters]);

  return filteredProducts;
};
