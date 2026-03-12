import { useState, useCallback } from "react";
import { FilterState } from "../types";

const initialFilters: FilterState = {
  selectedCategory: "all",
  sortBy: "featured",
  priceRange: [0, 500],
};

export const useFilters = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
};
