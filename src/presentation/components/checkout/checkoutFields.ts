import { SHIPPING_COUNTRY } from "@/application/checkout";
import type { CheckoutDetails } from "@/application/dtos/Order";
import type { FieldErrors } from "@/application/errors";
import type { PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { messages } from "@/presentation/i18n";
import { orderFieldErrors, validationMessage } from "@/presentation/components/forms/validationMessages";
import type { FormErrorSummaryItem } from "@/presentation/components/forms/FormErrorSummary";

export type CheckoutStepId = "contact" | "shipping" | "review";
export type FormStepId = Exclude<CheckoutStepId, "review">;

export const CHECKOUT_STEPS: readonly CheckoutStepId[] = ["contact", "shipping", "review"];

/** Field paths (as used by validateCheckoutDetails / FormValidationError) in on-screen order, per step. */
export const STEP_FIELDS: Record<FormStepId, readonly string[]> = {
  contact: ["customer.email", "customer.firstName", "customer.lastName", "customer.phone"],
  shipping: [
    "shippingAddress.address",
    "shippingAddress.postalCode",
    "shippingAddress.city",
    "shippingAddress.province",
    "shippingAddress.country",
    "shippingMethod",
  ],
};

const ALL_FIELDS = [...STEP_FIELDS.contact, ...STEP_FIELDS.shipping];

export function checkoutFieldId(path: string): string {
  return `checkout-${path.replace(/\./g, "-")}`;
}

/** The step whose form contains the first failing field. */
export function stepOwningFirstError(errors: FieldErrors): FormStepId {
  const [first] = orderFieldErrors(errors, ALL_FIELDS);
  return first && STEP_FIELDS.contact.includes(first[0]) ? "contact" : "shipping";
}

export function errorsForStep(errors: FieldErrors, step: FormStepId): FieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([field]) => STEP_FIELDS[step].includes(field)));
}

export function summaryItems(errors: FieldErrors, step: FormStepId): FormErrorSummaryItem[] {
  return orderFieldErrors(errors, STEP_FIELDS[step]).map(([field, code]) => ({
    fieldId: checkoutFieldId(field),
    label: messages.checkout.fields[field] ?? field,
    message: validationMessage(code),
  }));
}

export function firstInvalidIds(errors: FieldErrors, step: FormStepId): string[] {
  return orderFieldErrors(errors, STEP_FIELDS[step]).map(([field]) => checkoutFieldId(field));
}

export function emptyCheckoutDetails(policy: PricingPolicy): CheckoutDetails {
  return {
    customer: { email: "", firstName: "", lastName: "", phone: "" },
    shippingAddress: { address: "", city: "", province: "", postalCode: "", country: SHIPPING_COUNTRY },
    shippingMethod: policy.shippingRates[0]?.id ?? "standard",
    notes: "",
    marketingOptIn: false,
  };
}
