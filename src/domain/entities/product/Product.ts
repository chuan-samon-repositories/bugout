import { ValidationError } from '../../errors';
import { Money } from '../../value-objects/Money';
import { ProductId } from '../../value-objects/ProductId';

/**
 * Product entity representing a product in the e-commerce system.
 * Enforces business rules for price validation, stock status, and discount calculations.
 */
export class Product {
  constructor(
    public readonly id: ProductId,
    public readonly name: string,
    public readonly price: Money,
    public readonly originalPrice: Money | null,
    public readonly rating: number,
    public readonly reviews: number,
    public readonly description: string,
    public readonly category: string,
    public readonly inStock: boolean,
    public readonly badge: string | null
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.price.amount <= 0) {
      throw new ValidationError("Price must be positive");
    }
    if (this.rating < 0 || this.rating > 5) {
      throw new ValidationError("Rating must be between 0 and 5");
    }
    if (this.reviews < 0) {
      throw new ValidationError("Reviews count cannot be negative");
    }
  }

  isOnSale(): boolean {
    return this.originalPrice !== null && this.originalPrice.amount > this.price.amount;
  }

  discountPercentage(): number {
    if (!this.originalPrice) return 0;
    return Math.round(((this.originalPrice.amount - this.price.amount) / this.originalPrice.amount) * 100);
  }

  isFeatured(): boolean {
    return this.badge === "BESTSELLER" || this.badge === "PREMIUM";
  }
}
