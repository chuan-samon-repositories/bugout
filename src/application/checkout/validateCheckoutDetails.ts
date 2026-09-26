import { CheckoutDetails } from '../dtos/Order';
import { FieldErrors } from '../errors';
import { isBlank, isValidEmail } from '../validation';

export type CheckoutStep = 'contact' | 'shipping' | 'all';

/** Spain-only shipping. */
export const SHIPPING_COUNTRY = 'ES';

/**
 * Postal-code prefixes outside the IVA territory (Las Palmas, Santa Cruz de Tenerife,
 * Ceuta, Melilla). Prices include 21 % IVA, so the store ships to the peninsula and
 * the Balearic Islands only.
 */
export const NON_SHIPPABLE_POSTAL_PREFIXES: readonly string[] = ['35', '38', '51', '52'];

export function isShippablePostalCode(postalCode: string): boolean {
  return !NON_SHIPPABLE_POSTAL_PREFIXES.includes(postalCode.trim().slice(0, 2));
}

const SPANISH_POSTAL_CODE = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
const SPANISH_PHONE = /^[6-9]\d{8}$/;

/** Accepts Spanish landline/mobile numbers, optionally prefixed with +34 or 0034 and grouped with spaces, dashes or dots. */
export function isValidSpanishPhone(value: string): boolean {
  const digits = value.replace(/[\s.-]/g, '').replace(/^(\+34|0034)/, '');
  return SPANISH_PHONE.test(digits);
}

function validateContact({ customer }: CheckoutDetails, errors: FieldErrors): void {
  if (isBlank(customer.email)) errors['customer.email'] = 'required';
  else if (!isValidEmail(customer.email)) errors['customer.email'] = 'invalidEmail';
  if (isBlank(customer.firstName)) errors['customer.firstName'] = 'required';
  if (isBlank(customer.lastName)) errors['customer.lastName'] = 'required';
  if (!isBlank(customer.phone) && !isValidSpanishPhone(customer.phone)) {
    errors['customer.phone'] = 'invalidPhone';
  }
}

function validateShipping({ shippingAddress: address }: CheckoutDetails, errors: FieldErrors): void {
  if (isBlank(address.address)) errors['shippingAddress.address'] = 'required';
  if (isBlank(address.city)) errors['shippingAddress.city'] = 'required';
  if (isBlank(address.province)) errors['shippingAddress.province'] = 'required';
  if (isBlank(address.postalCode)) errors['shippingAddress.postalCode'] = 'required';
  else if (!SPANISH_POSTAL_CODE.test(address.postalCode.trim())) {
    errors['shippingAddress.postalCode'] = 'invalidPostalCode';
  } else if (!isShippablePostalCode(address.postalCode)) {
    errors['shippingAddress.postalCode'] = 'unsupportedRegion';
  }
  if ((address.country ?? '').trim().toUpperCase() !== SHIPPING_COUNTRY) {
    errors['shippingAddress.country'] = 'required';
  }
}

/** Validates the fields of one checkout step (or all of them); an empty object means valid. */
export function validateCheckoutDetails(details: CheckoutDetails, step: CheckoutStep): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 'contact' || step === 'all') validateContact(details, errors);
  if (step === 'shipping' || step === 'all') validateShipping(details, errors);
  return errors;
}
