import { useState, useEffect, useMemo } from "react";
import { Product } from "../../domain/entities/product/Product";
import { DependencyContainer } from "../../infrastructure/config/dependencies";

/**
 * React hook for fetching all products.
 * Uses GetProductsUseCase through dependency injection.
 *
 * @returns Object containing products array, loading state, and error message
 *
 * Requirements: 5.2, 5.6
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the useCase to prevent recreating on every render
  const useCase = useMemo(() => {
    return DependencyContainer.getInstance().getGetProductsUseCase();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const result = await useCase.execute();
        setProducts(result);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load products",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [useCase]);

  return { products, loading, error };
}
