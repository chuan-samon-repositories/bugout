export type ValidationCode =
  | 'required'
  | 'invalidEmail'
  | 'invalidPhone'
  | 'invalidPostalCode'
  | 'unsupportedRegion'
  /** A valid, shippable postal code that belongs to a different province than the one selected. */
  | 'postalCodeMismatch'
  | 'tooShort'
  | 'tooLong';

export type FieldErrors = Record<string, ValidationCode>;

/** Thrown by use cases when user input is invalid; `fieldErrors` is keyed by field path (e.g. "customer.email"). */
export class FormValidationError extends Error {
  constructor(public readonly fieldErrors: FieldErrors) {
    super(`Invalid fields: ${Object.keys(fieldErrors).join(', ')}`);
    this.name = 'FormValidationError';
  }
}
