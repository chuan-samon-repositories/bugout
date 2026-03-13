"use client";

import { useMemo } from "react";
import { useProductFilters } from "@/presentation/hooks";
import { useFilters } from "./components/useFilters";
import { generateCategories, sortOptions } from "./components/productHelpers";
import {
  ProductsHeader,
  CompactFilters,
  ProductsGrid,
  LoadingSpinner,
  ErrorMessage,
} from "./components";
import { Product as UIProduct } from "./types";
import { Product as DomainProduct } from "@/domain/entities/product/Product";
import { FilterCriteria, SortOption } from "@/application/dtos/FilterCriteria";
import { FilterState } from "./types";

/**
 * Transform domain Product entity to UI Product type
 */
function transformProductForUI(product: DomainProduct): UIProduct {
  return {
    id: product.id.value,
    name: product.name,
    price: product.price.amount,
    originalPrice: product.originalPrice?.amount,
    rating: product.rating,
    reviews: product.reviews,
    description: product.description,
    category: product.category,
    featured: product.isFeatured(),
    inStock: product.inStock,
    badge: product.badge || undefined,
  };
}

/**
 * Convert UI FilterState to application FilterCriteria
 */
function convertFilterStateToFilterCriteria(filters: FilterState): FilterCriteria {
  return {
    category: filters.selectedCategory !== "all" ? filters.selectedCategory : undefined,
    priceRange: {
      min: filters.priceRange[0],
      max: filters.priceRange[1],
    },
    inStockOnly: filters.inStock,
    onSaleOnly: filters.onSale,
    sortBy: filters.sortBy as SortOption,
  };
}

export default function ProductsPage() {
  const { filters, updateFilters } = useFilters();
  
  // Convert filters to FilterCriteria for the new architecture
  const filterCriteria = useMemo(
    () => convertFilterStateToFilterCriteria(filters),
    [filters]
  );

  // Use new presentation layer hooks
  const { products: domainProducts, loading, error } = useProductFilters(filterCriteria);

  // Transform domain products to UI products
  const uiProducts = useMemo(
    () => domainProducts.map(transformProductForUI),
    [domainProducts]
  );

  const categories = useMemo(() => generateCategories(uiProducts), [uiProducts]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <ProductsHeader productCount={uiProducts.length} />

      {/* Compact Filters */}
      <CompactFilters
        categories={categories}
        filters={filters}
        onFilterChange={updateFilters}
        sortOptions={sortOptions}
      />

      {/* Products Grid */}
      <ProductsGrid products={uiProducts} />
    </div>
  );
}
