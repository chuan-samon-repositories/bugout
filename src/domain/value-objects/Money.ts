import { ValidationError } from '../errors';

/**
 * Value object representing a monetary amount.
 * Ensures non-negative amounts and provides arithmetic operations.
 */
export class Money {
  constructor(public readonly amount: number) {
    if (amount < 0) {
      throw new ValidationError("Money amount cannot be negative");
    }
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }
}
