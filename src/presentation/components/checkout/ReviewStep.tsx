"use client";

import type { ReactNode, Ref } from "react";
import type { CheckoutDetails } from "@/application/dtos/Order";
import type { ShippingRate } from "@/domain/entities/order/OrderPricing";
import type { Money } from "@/domain/value-objects/Money";
import { AlertCircleIcon, Button, InfoIcon, VisuallyHidden } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { formatShippingPrice, deliveryEstimate, shippingMethodLabel } from "./shippingCopy";
import { StepForm } from "./StepForm";

export interface ReviewStepProps {
  details: CheckoutDetails;
  rate: ShippingRate | null;
  shippingPrice: Money;
  headingRef: Ref<HTMLHeadingElement>;
  placing: boolean;
  placeError: string | null;
  onEdit(step: "contact" | "shipping"): void;
  onBack(): void;
  onSubmit(): void;
}

const copy = messages.checkout;

function ReviewSection({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel: string;
  onEdit(): void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-muted/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-ink">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          {copy.review.edit}
          <VisuallyHidden> {editLabel}</VisuallyHidden>
        </Button>
      </div>
      {/* ph-no-capture: PostHog autocapture never records the customer data shown here. */}
      <div className="ph-no-capture mt-2 space-y-1 break-words text-sm text-muted">{children}</div>
    </section>
  );
}

export function ReviewStep({
  details,
  rate,
  shippingPrice,
  headingRef,
  placing,
  placeError,
  onEdit,
  onBack,
  onSubmit,
}: ReviewStepProps) {
  const { customer, shippingAddress: address } = details;
  return (
    <StepForm
      title={copy.steps.review}
      headingRef={headingRef}
      errors={[]}
      onSubmit={onSubmit}
      actions={
        <>
          <Button variant="ghost" onClick={onBack} disabled={placing}>
            {copy.back}
          </Button>
          <Button type="submit" size="lg" loading={placing}>
            {copy.review.placeOrder}
          </Button>
        </>
      }
    >
      <ReviewSection title={copy.review.contactTitle} editLabel={copy.review.editContact} onEdit={() => onEdit("contact")}>
        <p className="font-medium text-ink">
          {customer.firstName} {customer.lastName}
        </p>
        <p>{customer.email}</p>
        {customer.phone.trim() && <p>{customer.phone}</p>}
        {/* The opt-in is only offered while messaging is enabled, so a ticked box means real emails. */}
        {details.marketingOptIn && <p>{copy.review.marketingYes}</p>}
      </ReviewSection>
      <ReviewSection title={copy.review.shippingTitle} editLabel={copy.review.editShipping} onEdit={() => onEdit("shipping")}>
        <p className="font-medium text-ink">{address.address}</p>
        <p>
          {address.postalCode} {address.city}
        </p>
        <p>
          {address.province}, {copy.countryName}
        </p>
        {rate && (
          <p className="pt-2">
            <span className="font-medium text-ink">{copy.review.methodTitle}:</span> {shippingMethodLabel(rate)} (
            {deliveryEstimate(rate).toLowerCase()}) · {formatShippingPrice(shippingPrice)}
          </p>
        )}
        {details.notes.trim() && (
          <p className="pt-2">
            <span className="font-medium text-ink">{copy.review.notesTitle}:</span> {details.notes}
          </p>
        )}
      </ReviewSection>
      <p className="flex items-start gap-3 rounded-lg border border-navy/30 bg-sand/40 p-4 text-sm font-medium text-ink">
        <InfoIcon className="mt-0.5 size-5 shrink-0 text-navy" />
        <span className="min-w-0">{copy.review.demoNotice}</span>
      </p>
      {placeError && (
        <div role="alert" className="flex flex-col gap-3 rounded-lg border border-danger p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm font-medium text-danger">
            <AlertCircleIcon className="mt-0.5 size-5 shrink-0" />
            <span className="min-w-0">{placeError}</span>
          </p>
          <Button variant="secondary" size="sm" onClick={onSubmit} loading={placing} className="shrink-0">
            {copy.review.retry}
          </Button>
        </div>
      )}
    </StepForm>
  );
}
