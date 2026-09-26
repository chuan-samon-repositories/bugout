import type { FieldErrors, ValidationCode } from "@/application/errors";
import { messages } from "@/presentation/i18n";

export interface ValidationMessageOptions {
  minLength?: number;
  maxLength?: number;
}

/** Spanish copy for a validation code returned by a use case. */
export function validationMessage(code: ValidationCode, options: ValidationMessageOptions = {}): string {
  const copy = messages.forms.validation;
  switch (code) {
    case "required":
      return copy.required;
    case "invalidEmail":
      return copy.invalidEmail;
    case "invalidPhone":
      return copy.invalidPhone;
    case "invalidPostalCode":
      return copy.invalidPostalCode;
    case "unsupportedRegion":
      return copy.unsupportedRegion;
    case "tooShort":
      return copy.tooShort(options.minLength);
    case "tooLong":
      return copy.tooLong(options.maxLength);
  }
}

/** Field errors as [field, code] pairs in form order; fields missing from `order` go last. */
export function orderFieldErrors(errors: FieldErrors, order: readonly string[]): Array<[string, ValidationCode]> {
  const rank = (field: string) => {
    const index = order.indexOf(field);
    return index === -1 ? order.length : index;
  };
  return Object.entries(errors).sort(([a], [b]) => rank(a) - rank(b));
}
