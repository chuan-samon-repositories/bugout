"use client";

import type { Ref } from "react";
import type { CheckoutDetails, ShippingAddress } from "@/application/dtos/Order";
import type { FieldErrors } from "@/application/errors";
import type { PricingPolicy, ShippingMethodId } from "@/domain/entities/order/OrderPricing";
import type { Money } from "@/domain/value-objects/Money";
import {
  Button,
  RadioGroupField,
  SelectField,
  TextAreaField,
  TextField,
  type RadioOption,
} from "@/presentation/components/ui";
import { validationMessage } from "@/presentation/components/forms/validationMessages";
import { formatMoney, messages } from "@/presentation/i18n";
import { checkoutFieldId, summaryItems } from "./checkoutFields";
import { SPANISH_PROVINCES } from "./provinces";
import { chargedShippingPrice, deliveryEstimate, shippingMethodLabel } from "./shippingCopy";
import { StepForm } from "./StepForm";

export interface ShippingStepProps {
  details: CheckoutDetails;
  errors: FieldErrors;
  policy: PricingPolicy;
  subtotal: Money;
  headingRef: Ref<HTMLHeadingElement>;
  onAddressChange(patch: Partial<ShippingAddress>): void;
  onMethodChange(method: ShippingMethodId): void;
  onNotesChange(notes: string): void;
  onBack(): void;
  onSubmit(): void;
}

const copy = messages.checkout;
const provinceOptions = SPANISH_PROVINCES.map((province) => ({ value: province, label: province }));
const NOTES_MAX_LENGTH = 500;

export function ShippingStep({
  details,
  errors,
  policy,
  subtotal,
  headingRef,
  onAddressChange,
  onMethodChange,
  onNotesChange,
  onBack,
  onSubmit,
}: ShippingStepProps) {
  const { shippingAddress: address } = details;
  const errorFor = (path: string) => {
    const code = errors[path];
    return code ? validationMessage(code) : null;
  };
  const fieldProps = (field: Exclude<keyof ShippingAddress, "country">) => {
    const path = `shippingAddress.${field}`;
    return {
      id: checkoutFieldId(path),
      name: field,
      label: copy.fields[path],
      value: address[field],
      error: errorFor(path),
      required: true,
      onChange: (event: { target: { value: string } }) => onAddressChange({ [field]: event.target.value }),
    };
  };

  const methodOptions: RadioOption[] = policy.shippingRates.map((rate) => {
    const showFreeFrom = rate.freeFrom !== null && !subtotal.greaterThanOrEqual(rate.freeFrom);
    return {
      value: rate.id,
      label: shippingMethodLabel(rate),
      description:
        showFreeFrom && rate.freeFrom
          ? `${deliveryEstimate(rate)} · ${copy.freeFrom(formatMoney(rate.freeFrom))}`
          : deliveryEstimate(rate),
      aside: chargedShippingPrice(rate, subtotal),
    };
  });

  return (
    <StepForm
      title={copy.steps.shipping}
      headingRef={headingRef}
      errors={summaryItems(errors, "shipping")}
      onSubmit={onSubmit}
      actions={
        <>
          <Button variant="ghost" onClick={onBack}>
            {copy.back}
          </Button>
          <Button type="submit" size="lg">
            {copy.continueToReview}
          </Button>
        </>
      }
    >
      <TextField {...fieldProps("address")} autoComplete="street-address" hint={copy.hints.address} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          {...fieldProps("postalCode")}
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={5}
        />
        <TextField {...fieldProps("city")} autoComplete="address-level2" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          {...fieldProps("province")}
          autoComplete="address-level1"
          options={provinceOptions}
          placeholder={copy.provincePlaceholder}
        />
        <TextField
          id={checkoutFieldId("shippingAddress.country")}
          name="country"
          label={copy.fields["shippingAddress.country"]}
          value={copy.countryName}
          readOnly
          autoComplete="country-name"
          hint={copy.hints.country}
          error={errorFor("shippingAddress.country")}
          inputClassName="bg-sand/30!"
        />
      </div>
      <RadioGroupField
        id={checkoutFieldId("shippingMethod")}
        name="shippingMethod"
        label={copy.fields.shippingMethod}
        required
        options={methodOptions}
        value={details.shippingMethod}
        onValueChange={(value) => {
          const rate = policy.shippingRates.find((candidate) => candidate.id === value);
          if (rate) onMethodChange(rate.id);
        }}
        error={errorFor("shippingMethod")}
      />
      <TextAreaField
        id="checkout-notes"
        name="notes"
        label={copy.fields.notes}
        rows={3}
        maxLength={NOTES_MAX_LENGTH}
        value={details.notes}
        onChange={(event) => onNotesChange(event.target.value)}
      />
    </StepForm>
  );
}
