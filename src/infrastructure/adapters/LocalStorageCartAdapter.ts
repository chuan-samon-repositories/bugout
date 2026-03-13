import { Cart } from "../../domain/entities/cart/Cart";
import { Product } from "../../domain/entities/product/Product";
import { CartRepository } from "../../application/ports/CartRepository";
import { Money } from "../../domain/value-objects/Money";
import { ProductId } from "../../domain/value-objects/ProductId";
import { Quantity } from "../../domain/value-objects/Quantity";
import { CartDTO } from "@/domain/entities/cart/CartDTO";

/**
 * LocalStorageCartAdapter implements CartRepository using browser localStorage.
 * Handles serialization and deserialization of Cart entities to/from JSON.
 */
export class LocalStorageCartAdapter implements CartRepository {
  private readonly storageKey = "shopping-cart";

  async save(cart: Cart): Promise<void> {
    const serialized = this.serializeCart(cart);
    localStorage.setItem(this.storageKey, JSON.stringify(serialized));
  }

  async load(): Promise<Cart> {
    const data = localStorage.getItem(this.storageKey);
    if (!data) {
      return new Cart();
    }

    try {
      const parsed = JSON.parse(data);
      return this.deserializeCart(parsed);
    } catch (error) {
      console.error("Failed to parse cart data:", error);
      return new Cart();
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  private serializeCart(cart: Cart): CartDTO {
    return {
      items: cart.getItems().map((item) => ({
        product: {
          id: item.product.id.value,
          name: item.product.name,
          price: item.product.price.amount,
          originalPrice: item.product.originalPrice?.amount ?? null,
          rating: item.product.rating,
          reviews: item.product.reviews,
          description: item.product.description,
          category: item.product.category,
          inStock: item.product.inStock,
          badge: item.product.badge,
        },
        quantity: item.quantity.value,
      })),
    };
  }

  private deserializeCart(data: CartDTO): Cart {
    const cart = new Cart();

    if (!data.items || !Array.isArray(data.items)) {
      return cart;
    }

    for (const item of data.items) {
      try {
        const product = new Product(
          new ProductId(item.product.id),
          item.product.name,
          new Money(item.product.price),
          item.product.originalPrice !== null
            ? new Money(item.product.originalPrice)
            : null,
          item.product.rating,
          item.product.reviews,
          item.product.description,
          item.product.category,
          item.product.inStock,
          item.product.badge,
        );

        const quantity = new Quantity(item.quantity);
        cart.addItem(product, quantity);
      } catch (error) {
        // Skip invalid items but continue processing others
        console.error("Failed to deserialize cart item:", error);
      }
    }

    return cart;
  }
}
