import { ValidationError } from '../errors';

/** ISO 4217 currency code, e.g. "EUR". */
export type CurrencyCode = string;

const MINOR_UNITS_PER_MAJOR = 100;

/**
 * Value object representing a non-negative monetary amount in a single currency.
 * Amounts are stored as integer minor units (cents) so arithmetic never drifts.
 */
export class Money {
  private constructor(
    public readonly minor: number,
    public readonly currency: CurrencyCode,
  ) {}

  static fromMinor(minor: number, currency: CurrencyCode): Money {
    if (!Number.isInteger(minor)) {
      throw new ValidationError('Money minor amount must be an integer');
    }
    if (minor < 0) {
      throw new ValidationError('Money amount cannot be negative');
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new ValidationError(`Invalid currency code: ${currency}`);
    }
    return new Money(minor, currency);
  }

  /** Builds Money from a major-unit amount (e.g. 19.99 or "19.99" from Shopify's MoneyV2). */
  static fromMajor(amount: number | string, currency: CurrencyCode): Money {
    const value = typeof amount === 'string' ? Number(amount) : amount;
    if (!Number.isFinite(value)) {
      throw new ValidationError(`Invalid money amount: ${amount}`);
    }
    return Money.fromMinor(Math.round(value * MINOR_UNITS_PER_MAJOR), currency);
  }

  static zero(currency: CurrencyCode): Money {
    return Money.fromMinor(0, currency);
  }

  /** Amount in major units (e.g. euros). Use for display and analytics only. */
  get amount(): number {
    return this.minor / MINOR_UNITS_PER_MAJOR;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromMinor(this.minor + other.minor, this.currency);
  }

  /** Difference clamped at zero (Money is never negative). */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromMinor(Math.max(0, this.minor - other.minor), this.currency);
  }

  multiply(factor: number): Money {
    if (!Number.isFinite(factor) || factor < 0) {
      throw new ValidationError('Money can only be multiplied by a non-negative number');
    }
    return Money.fromMinor(Math.round(this.minor * factor), this.currency);
  }

  isZero(): boolean {
    return this.minor === 0;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minor > other.minor;
  }

  greaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minor >= other.minor;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.minor === other.minor;
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new ValidationError(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
