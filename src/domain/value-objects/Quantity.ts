import { ValidationError } from '../errors';

/**
 * Value object representing a quantity of items.
 * Ensures positive integer quantities.
 */
export class Quantity {
  constructor(public readonly value: number) {
    if (value < 1) {
      throw new ValidationError("Quantity must be at least 1");
    }
    if (!Number.isInteger(value)) {
      throw new ValidationError("Quantity must be an integer");
    }
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }
}
