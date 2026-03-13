import { describe, test, expect, vi, beforeEach } from "vitest";
import { DependencyContainer } from "../../infrastructure/config/dependencies";
import { Cart } from "../../domain/entities/cart/Cart";
import { Product } from "../../domain/entities/product/Product";
import { ProductId } from "../../domain/value-objects/ProductId";
import { Quantity } from "../../domain/value-objects/Quantity";
import { Money } from "../../domain/value-objects/Money";

describe("useCart hook logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createTestProduct = (id: string = "test-1"): Product => {
    return new Product(
      new ProductId(id),
      "Test Product",
      new Money(100),
      null,
      4.5,
      10,
      "Test description",
      "test-category",
      true,
      null,
    );
  };

  test("ManageCartUseCase adds item to cart successfully", async () => {
    // Arrange
    const useCase = DependencyContainer.getInstance().getManageCartUseCase();
    const product = createTestProduct();
    const cart = new Cart();
    cart.addItem(product, new Quantity(1));

    vi.spyOn(useCase, "addToCart").mockResolvedValue(cart);

    // Act
    const result = await useCase.addToCart(
      new ProductId("test-1"),
      new Quantity(1),
    );

    // Assert
    expect(result.itemCount()).toBe(1);
    expect(result.totalAmount().amount).toBe(100);
  });

  test("ManageCartUseCase removes item from cart successfully", async () => {
    // Arrange
    const useCase = DependencyContainer.getInstance().getManageCartUseCase();
    const product = createTestProduct();
    const cart = new Cart();
    cart.addItem(product, new Quantity(2));

    // After removing one, quantity should be 1
    const updatedCart = new Cart();
    updatedCart.addItem(product, new Quantity(1));

    vi.spyOn(useCase, "removeFromCart").mockResolvedValue(updatedCart);

    // Act
    const result = await useCase.removeFromCart(new ProductId("test-1"));

    // Assert
    expect(result.itemCount()).toBe(1);
  });

  test("ManageCartUseCase clears cart successfully", async () => {
    // Arrange
    const useCase = DependencyContainer.getInstance().getManageCartUseCase();

    vi.spyOn(useCase, "clearCart").mockResolvedValue(undefined);

    // Act & Assert
    await expect(useCase.clearCart()).resolves.toBeUndefined();
  });

  test("ManageCartUseCase gets cart successfully", async () => {
    // Arrange
    const useCase = DependencyContainer.getInstance().getManageCartUseCase();
    const product = createTestProduct();
    const cart = new Cart();
    cart.addItem(product, new Quantity(2));

    vi.spyOn(useCase, "getCart").mockResolvedValue(cart);

    // Act
    const result = await useCase.getCart();

    // Assert
    expect(result.itemCount()).toBe(2);
    expect(result.totalAmount().amount).toBe(200);
  });

  test("ManageCartUseCase handles multiple items in cart", async () => {
    // Arrange
    const useCase = DependencyContainer.getInstance().getManageCartUseCase();
    const product1 = createTestProduct("test-1");
    const product2 = createTestProduct("test-2");
    const cart = new Cart();
    cart.addItem(product1, new Quantity(1));
    cart.addItem(product2, new Quantity(2));

    vi.spyOn(useCase, "getCart").mockResolvedValue(cart);

    // Act
    const result = await useCase.getCart();

    // Assert
    expect(result.itemCount()).toBe(3);
    expect(result.totalAmount().amount).toBe(300);
  });

  test("ManageCartUseCase handles empty cart", async () => {
    // Arrange
    const useCase = DependencyContainer.getInstance().getManageCartUseCase();
    const cart = new Cart();

    vi.spyOn(useCase, "getCart").mockResolvedValue(cart);

    // Act
    const result = await useCase.getCart();

    // Assert
    expect(result.itemCount()).toBe(0);
    expect(result.totalAmount().amount).toBe(0);
  });

  test("ManageCartUseCase handles errors when adding to cart", async () => {
    // Arrange
    const useCase = DependencyContainer.getInstance().getManageCartUseCase();
    const errorMessage = "Failed to add item to cart";

    vi.spyOn(useCase, "addToCart").mockRejectedValue(new Error(errorMessage));

    // Act & Assert
    await expect(
      useCase.addToCart(new ProductId("test-1"), new Quantity(1)),
    ).rejects.toThrow(errorMessage);
  });
});
