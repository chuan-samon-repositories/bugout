import { ValidationError } from '@/domain/errors';

/**
 * Value object representing a unique product identifier.
 * Ensures non-empty product IDs.
 */
export class ProductId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new ValidationError("ProductId cannot be empty");
    }
  }

  equals(other: ProductId): boolean {
    return this.value === other.value;
  }
}
