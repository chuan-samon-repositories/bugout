/**
 * Base class for all domain-specific errors.
 * Domain errors represent business rule violations, validation failures,
 * and other domain-level exceptional conditions.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when input validation fails or data doesn't meet domain constraints.
 * Examples: negative prices, invalid ratings, empty required fields.
 */
export class ValidationError extends DomainError {}

/**
 * Thrown when a requested resource cannot be found.
 * Examples: product not found by ID, cart item not in cart.
 */
export class NotFoundError extends DomainError {}

/**
 * Thrown when a business rule is violated.
 * Examples: exceeding maximum cart quantity, adding out-of-stock items.
 */
export class BusinessRuleError extends DomainError {}
