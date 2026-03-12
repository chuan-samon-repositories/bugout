"use client";

import { useMemo } from "react";
import { useProducts, useProductFilters, useFilters } from "./hooks";
import { generateCategories, sortOptions } from "./utils/productUtils";
import {
  ProductsHeader,
  CompactFilters,
  ProductsGrid,
  LoadingSpinner,
  ErrorMessage,
} from "./components";

export default function ProductsPage() {
  const { products, loading, error } = useProducts();
  const { filters, updateFilters } = useFilters();

  const categories = useMemo(() => generateCategories(products), [products]);
  const filteredProducts = useProductFilters(products, filters);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <ProductsHeader productCount={filteredProducts.length} />

      {/* Compact Filters */}
      <CompactFilters
        categories={categories}
        filters={filters}
        onFilterChange={updateFilters}
        sortOptions={sortOptions}
      />

      {/* Products Grid */}
      <ProductsGrid products={filteredProducts} />
    </div>
  );
}
