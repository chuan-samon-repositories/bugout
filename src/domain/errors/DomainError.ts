/**
 * Base class for all domain-specific errors.
 * Domain errors represent business rule violations, validation failures,
 * and other domain-level exceptional conditions.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when input validation fails or data doesn't meet domain constraints.
 * Examples: negative prices, invalid ratings, empty required fields.
 */
export class ValidationError extends DomainError {}

/**
 * Thrown when a requested resource cannot be found.
 * Examples: product not found by id or slug, cart item not in cart.
 */
export class NotFoundError extends DomainError {}

/** Stable identifiers for business rule violations, so callers can react without parsing messages. */
export type BusinessRuleCode =
  | 'MAX_QUANTITY_EXCEEDED'
  | 'OUT_OF_STOCK'
  | 'CURRENCY_MISMATCH';

/**
 * Thrown when a business rule is violated.
 * Examples: exceeding maximum cart quantity, adding out-of-stock items.
 */
export class BusinessRuleError extends DomainError {
  constructor(
    public readonly code: BusinessRuleCode,
    message: string,
  ) {
    super(message);
  }
}
