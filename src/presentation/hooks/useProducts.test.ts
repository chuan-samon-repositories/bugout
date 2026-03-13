import { describe, test, expect, vi, beforeEach } from "vitest";
import { DependencyContainer } from "../../infrastructure/config/dependencies";
import { Product } from "../../domain/entities/product/Product";
import { ProductId } from "../../domain/value-objects/ProductId";
import { Money } from "../../domain/value-objects/Money";

describe("useProducts hook logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("GetProductsUseCase returns products successfully", async () => {
    // Arrange
    const mockProducts: Product[] = [
      new Product(
        new ProductId("test-1"),
        "Test Product 1",
        new Money(100),
        null,
        4.5,
        10,
        "Test description 1",
        "test-category",
        true,
        null,
      ),
      new Product(
        new ProductId("test-2"),
        "Test Product 2",
        new Money(200),
        new Money(250),
        4.0,
        20,
        "Test description 2",
        "test-category",
        true,
        "BESTSELLER",
      ),
    ];

    const useCase = DependencyContainer.getInstance().getGetProductsUseCase();

    // Mock the repository to return test products
    vi.spyOn(useCase, "execute").mockResolvedValue(mockProducts);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toEqual(mockProducts);
    expect(result).toHaveLength(2);
    expect(result[0].id.value).toBe("test-1");
    expect(result[1].id.value).toBe("test-2");
  });

  test("GetProductsUseCase handles errors correctly", async () => {
    // Arrange
    const useCase = DependencyContainer.getInstance().getGetProductsUseCase();
    const errorMessage = "Failed to load products";

    vi.spyOn(useCase, "execute").mockRejectedValue(new Error(errorMessage));

    // Act & Assert
    await expect(useCase.execute()).rejects.toThrow(errorMessage);
  });

  test("GetProductsUseCase returns empty array when no products exist", async () => {
    // Arrange
    const useCase = DependencyContainer.getInstance().getGetProductsUseCase();

    vi.spyOn(useCase, "execute").mockResolvedValue([]);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});
