"use client";

import type { Ref } from "react";
import type { CheckoutDetails, CustomerDetails } from "@/application/dtos/Order";
import type { FieldErrors } from "@/application/errors";
import { Button, CheckboxField, TextField } from "@/presentation/components/ui";
import { validationMessage } from "@/presentation/components/forms/validationMessages";
import { messages } from "@/presentation/i18n";
import { checkoutFieldId, summaryItems } from "./checkoutFields";
import { StepForm } from "./StepForm";

export interface ContactStepProps {
  details: CheckoutDetails;
  errors: FieldErrors;
  headingRef: Ref<HTMLHeadingElement>;
  onCustomerChange(patch: Partial<CustomerDetails>): void;
  onMarketingChange(optIn: boolean): void;
  onSubmit(): void;
}

const copy = messages.checkout;

export function ContactStep({ details, errors, headingRef, onCustomerChange, onMarketingChange, onSubmit }: ContactStepProps) {
  const { customer } = details;
  const fieldProps = (field: keyof CustomerDetails) => {
    const path = `customer.${field}`;
    const code = errors[path];
    return {
      id: checkoutFieldId(path),
      name: field,
      label: copy.fields[path],
      value: customer[field],
      error: code ? validationMessage(code) : null,
      onChange: (event: { target: { value: string } }) => onCustomerChange({ [field]: event.target.value }),
    };
  };

  return (
    <StepForm
      title={copy.steps.contact}
      headingRef={headingRef}
      errors={summaryItems(errors, "contact")}
      onSubmit={onSubmit}
      actions={
        <Button type="submit" size="lg" className="sm:ml-auto">
          {copy.continueToShipping}
        </Button>
      }
    >
      <TextField {...fieldProps("email")} type="email" inputMode="email" autoComplete="email" required />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField {...fieldProps("firstName")} autoComplete="given-name" required />
        <TextField {...fieldProps("lastName")} autoComplete="family-name" required />
      </div>
      <TextField {...fieldProps("phone")} type="tel" inputMode="tel" autoComplete="tel" hint={copy.hints.phone} />
      <CheckboxField
        id="checkout-marketingOptIn"
        name="marketingOptIn"
        label={copy.marketingOptIn}
        checked={details.marketingOptIn}
        onChange={(event) => onMarketingChange(event.target.checked)}
      />
    </StepForm>
  );
}
