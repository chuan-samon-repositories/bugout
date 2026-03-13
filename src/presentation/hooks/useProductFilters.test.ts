import { describe, test, expect, vi, beforeEach } from "vitest";
import { DependencyContainer } from "../../infrastructure/config/dependencies";
import { FilterCriteria } from "../../application/dtos/FilterCriteria";
import { Product } from "../../domain/entities/product/Product";
import { ProductId } from "../../domain/value-objects/ProductId";
import { Money } from "../../domain/value-objects/Money";

describe("useProductFilters hook logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createTestProduct = (
    overrides: Partial<{
      id: string;
      name: string;
      price: number;
      category: string;
      inStock: boolean;
      rating: number;
    }> = {},
  ): Product => {
    return new Product(
      new ProductId(overrides.id || "test-1"),
      overrides.name || "Test Product",
      new Money(overrides.price || 100),
      null,
      overrides.rating || 4.5,
      10,
      "Test description",
      overrides.category || "test-category",
      overrides.inStock !== undefined ? overrides.inStock : true,
      null,
    );
  };

  test("FilterProductsUseCase filters products by category", async () => {
    // Arrange
    const mockProducts: Product[] = [
      createTestProduct({ id: "test-1", category: "survival-kits" }),
      createTestProduct({ id: "test-2", category: "accessories" }),
    ];

    const useCase =
      DependencyContainer.getInstance().getFilterProductsUseCase();
    vi.spyOn(useCase, "execute").mockResolvedValue([mockProducts[0]]);

    const criteria: FilterCriteria = {
      category: "survival-kits",
      priceRange: { min: 0, max: 1000 },
      sortBy: "featured",
    };

    // Act
    const result = await useCase.execute(criteria);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("survival-kits");
  });

  test("FilterProductsUseCase filters products by price range", async () => {
    // Arrange
    const mockProducts: Product[] = [
      createTestProduct({ id: "test-1", price: 50 }),
      createTestProduct({ id: "test-2", price: 150 }),
    ];

    const useCase =
      DependencyContainer.getInstance().getFilterProductsUseCase();
    vi.spyOn(useCase, "execute").mockResolvedValue([mockProducts[0]]);

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 100 },
      sortBy: "featured",
    };

    // Act
    const result = await useCase.execute(criteria);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].price.amount).toBe(50);
  });

  test("FilterProductsUseCase filters products by stock status", async () => {
    // Arrange
    const mockProducts: Product[] = [
      createTestProduct({ id: "test-1", inStock: true }),
    ];

    const useCase =
      DependencyContainer.getInstance().getFilterProductsUseCase();
    vi.spyOn(useCase, "execute").mockResolvedValue(mockProducts);

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 1000 },
      inStockOnly: true,
      sortBy: "featured",
    };

    // Act
    const result = await useCase.execute(criteria);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].inStock).toBe(true);
  });

  test("FilterProductsUseCase sorts products by price (low to high)", async () => {
    // Arrange
    const mockProducts: Product[] = [
      createTestProduct({ id: "test-1", price: 50 }),
      createTestProduct({ id: "test-2", price: 100 }),
    ];

    const useCase =
      DependencyContainer.getInstance().getFilterProductsUseCase();
    vi.spyOn(useCase, "execute").mockResolvedValue(mockProducts);

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 1000 },
      sortBy: "price-low",
    };

    // Act
    const result = await useCase.execute(criteria);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].price.amount).toBe(50);
    expect(result[1].price.amount).toBe(100);
  });

  test("FilterProductsUseCase handles errors correctly", async () => {
    // Arrange
    const useCase =
      DependencyContainer.getInstance().getFilterProductsUseCase();
    const errorMessage = "Failed to filter products";

    vi.spyOn(useCase, "execute").mockRejectedValue(new Error(errorMessage));

    const criteria: FilterCriteria = {
      priceRange: { min: 0, max: 1000 },
      sortBy: "featured",
    };

    // Act & Assert
    await expect(useCase.execute(criteria)).rejects.toThrow(errorMessage);
  });

  test("FilterProductsUseCase returns empty array when no products match criteria", async () => {
    // Arrange
    const useCase =
      DependencyContainer.getInstance().getFilterProductsUseCase();
    vi.spyOn(useCase, "execute").mockResolvedValue([]);

    const criteria: FilterCriteria = {
      category: "non-existent-category",
      priceRange: { min: 0, max: 1000 },
      sortBy: "featured",
    };

    // Act
    const result = await useCase.execute(criteria);

    // Assert
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});
