import type { Product } from "@/domain/entities/product/Product";
import { getContainer } from "@/infrastructure/config";

/**
 * The catalog for content pages (how to choose, FAQ...). A failure must not break
 * those pages: they fall back to no products and hide the catalog-driven parts.
 */
export async function loadCatalogOrEmpty(page: string): Promise<Product[]> {
  try {
    return await getContainer().getGetProductsUseCase().execute();
  } catch (error) {
    console.error(`Could not load the catalog for ${page}`, error);
    return [];
  }
}
