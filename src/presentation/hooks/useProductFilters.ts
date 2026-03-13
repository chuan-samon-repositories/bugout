import { useState, useEffect, useMemo } from "react";
import { Product } from "../../domain/entities/product/Product";
import { FilterCriteria } from "../../application/dtos/FilterCriteria";
import { DependencyContainer } from "../../infrastructure/config/dependencies";

/**
 * React hook for filtering products based on criteria.
 * Uses FilterProductsUseCase through dependency injection.
 *
 * @param criteria - Filter criteria including category, price range, stock status, sale status, and sort option
 * @returns Object containing filtered products array, loading state, and error message
 *
 * Requirements: 5.3, 5.6
 */
export function useProductFilters(criteria: FilterCriteria) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the useCase to prevent recreating on every render
  const useCase = useMemo(() => {
    return DependencyContainer.getInstance().getFilterProductsUseCase();
  }, []);

  useEffect(() => {
    const filterProducts = async () => {
      try {
        setLoading(true);
        const result = await useCase.execute(criteria);
        setProducts(result);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to filter products",
        );
      } finally {
        setLoading(false);
      }
    };

    filterProducts();
  }, [criteria, useCase]);

  return { products, loading, error };
}
