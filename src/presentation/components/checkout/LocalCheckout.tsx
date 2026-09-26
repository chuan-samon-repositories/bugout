"use client";

import { useEffect, useRef, useState } from "react";
import { validateCheckoutDetails } from "@/application/checkout";
import type { CheckoutDetails, CustomerDetails, OrderConfirmation, ShippingAddress } from "@/application/dtos/Order";
import { FormValidationError, type FieldErrors } from "@/application/errors";
import type { Cart } from "@/domain/entities/cart/Cart";
import { calculateOrderTotals, type PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { Money } from "@/domain/value-objects/Money";
import { getContainer } from "@/infrastructure/config";
import { focusFirstInvalidField } from "@/presentation/components/forms/focusField";
import { useAnalytics } from "@/presentation/context/AnalyticsContext";
import { messages } from "@/presentation/i18n";
import {
  CHECKOUT_STEPS,
  emptyCheckoutDetails,
  errorsForStep,
  firstInvalidIds,
  stepOwningFirstError,
  type CheckoutStepId,
  type FormStepId,
} from "./checkoutFields";
import { CheckoutStepper } from "./CheckoutStepper";
import { ContactStep } from "./ContactStep";
import { OrderSummary } from "./OrderSummary";
import { ReviewStep } from "./ReviewStep";
import { shippingMethodLabel } from "./shippingCopy";
import { ShippingStep } from "./ShippingStep";

export interface LocalCheckoutProps {
  cart: Cart;
  policy: PricingPolicy;
  /** Called with the order snapshot once the order has been placed. */
  onOrderPlaced(confirmation: OrderConfirmation): Promise<void>;
}

type FocusRequest = { kind: "heading" } | { kind: "fields"; ids: string[] };

const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;

/** The in-app (demo) checkout: contact, shipping and review steps. No payment data is collected. */
export function LocalCheckout({ cart, policy, onOrderPlaced }: LocalCheckoutProps) {
  const analytics = useAnalytics();
  const [details, setDetails] = useState<CheckoutDetails>(() => emptyCheckoutDetails(policy));
  const [step, setStep] = useState<CheckoutStepId>("contact");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [returnToReview, setReturnToReview] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.kind === "heading") headingRef.current?.focus();
    else focusFirstInvalidField(focusRequest.ids);
  }, [focusRequest]);

  const subtotal = cart.totalAmount();
  const rate = policy.shippingRates.find((candidate) => candidate.id === details.shippingMethod) ?? null;
  const totals = calculateOrderTotals(cart, details.shippingMethod, policy);

  const goTo = (next: CheckoutStepId) => {
    setErrors({});
    setPlaceError(null);
    setStep(next);
    setFocusRequest({ kind: "heading" });
  };

  const goBackTo = (target: CheckoutStepId) => {
    if (step === "review") setReturnToReview(true);
    goTo(target);
  };

  const showErrors = (stepErrors: FieldErrors, owner: FormStepId) => {
    setErrors(stepErrors);
    setFocusRequest({ kind: "fields", ids: firstInvalidIds(stepErrors, owner) });
  };

  const trackStep = (stepId: CheckoutStepId) =>
    analytics.track({
      name: "checkout_step_completed",
      properties: {
        step: CHECKOUT_STEPS.indexOf(stepId) + 1,
        step_name: stepId,
        cart_value: subtotal.amount,
        cart_item_count: cart.itemCount(),
        currency: cart.currency,
      },
    });

  const submitStep = (stepId: FormStepId) => {
    const stepErrors = validateCheckoutDetails(details, stepId);
    if (hasErrors(stepErrors)) {
      showErrors(stepErrors, stepId);
      return;
    }
    trackStep(stepId);
    const shippingValid = !hasErrors(validateCheckoutDetails(details, "shipping"));
    const next = stepId === "shipping" || (returnToReview && shippingValid) ? "review" : "shipping";
    if (next === "review") setReturnToReview(false);
    goTo(next);
  };

  const placeOrder = async () => {
    if (placing) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const confirmation = await getContainer().getPlaceOrderUseCase().execute(details);
      trackStep("review");
      analytics.identify(details.customer.email.trim().toLowerCase(), { marketing_opt_in: details.marketingOptIn });
      const { totals: placed } = confirmation;
      analytics.track({
        name: "order_completed",
        properties: {
          order_id: confirmation.orderNumber,
          revenue: placed.total.amount,
          shipping: placed.shipping.amount,
          tax: placed.tax.amount,
          currency: placed.total.currency,
          item_count: confirmation.lines.reduce((count, line) => count + line.quantity, 0),
          shipping_method: confirmation.shippingMethod,
          products: confirmation.lines.map((line) => ({
            product_id: line.productId,
            quantity: line.quantity,
            price: Money.fromMinor(line.unitPriceMinor, placed.total.currency).amount,
          })),
        },
      });
      await onOrderPlaced(confirmation);
    } catch (error) {
      if (error instanceof FormValidationError) {
        const owner = stepOwningFirstError(error.fieldErrors);
        const stepErrors = errorsForStep(error.fieldErrors, owner);
        if (hasErrors(stepErrors)) {
          setReturnToReview(true);
          setStep(owner);
          showErrors(stepErrors, owner);
          return;
        }
      }
      analytics.captureException(error, { area: "checkout", action: "place_order" });
      setPlaceError(messages.checkout.review.placeError);
    } finally {
      setPlacing(false);
    }
  };

  const updateCustomer = (patch: Partial<CustomerDetails>) =>
    setDetails((current) => ({ ...current, customer: { ...current.customer, ...patch } }));
  const updateAddress = (patch: Partial<ShippingAddress>) =>
    setDetails((current) => ({ ...current, shippingAddress: { ...current.shippingAddress, ...patch } }));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
      <OrderSummary
        cart={cart}
        totals={totals}
        policy={policy}
        shippingLabel={rate ? shippingMethodLabel(rate) : undefined}
        className="lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1"
      />
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <CheckoutStepper current={step} onStepSelect={goBackTo} />
        <div className="mt-8">
          {step === "contact" && (
            <ContactStep
              details={details}
              errors={errors}
              headingRef={headingRef}
              onCustomerChange={updateCustomer}
              onMarketingChange={(marketingOptIn) => setDetails((current) => ({ ...current, marketingOptIn }))}
              onSubmit={() => submitStep("contact")}
            />
          )}
          {step === "shipping" && (
            <ShippingStep
              details={details}
              errors={errors}
              policy={policy}
              subtotal={subtotal}
              headingRef={headingRef}
              onAddressChange={updateAddress}
              onMethodChange={(shippingMethod) => setDetails((current) => ({ ...current, shippingMethod }))}
              onNotesChange={(notes) => setDetails((current) => ({ ...current, notes }))}
              onBack={() => goBackTo("contact")}
              onSubmit={() => submitStep("shipping")}
            />
          )}
          {step === "review" && (
            <ReviewStep
              details={details}
              rate={rate}
              shippingPrice={totals.shipping}
              headingRef={headingRef}
              placing={placing}
              placeError={placeError}
              onEdit={goBackTo}
              onBack={() => goBackTo("shipping")}
              onSubmit={() => void placeOrder()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
