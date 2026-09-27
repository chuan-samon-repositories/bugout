"use client";

import { useEffect, useRef, useState } from "react";
import { provinceForPostalCode, validateCheckoutDetails } from "@/application/checkout";
import type { CheckoutDetails, CustomerDetails, OrderConfirmation, ShippingAddress } from "@/application/dtos/Order";
import { FormValidationError, type FieldErrors } from "@/application/errors";
import { ValidationError } from "@/domain/errors";
import type { Cart } from "@/domain/entities/cart/Cart";
import { calculateOrderTotals, type PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { Money } from "@/domain/value-objects/Money";
import { getContainer } from "@/infrastructure/config";
import { focusFirstInvalidField } from "@/presentation/components/forms/focusField";
import { isMessagingEnabled } from "@/presentation/config/messaging";
import { useAnalytics } from "@/presentation/context/AnalyticsContext";
import { useCart } from "@/presentation/context/CartContext";
import { useNotifications } from "@/presentation/context/NotificationContext";
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
  /** Called with the order snapshot as soon as the order has been placed (the cart is refreshed separately). */
  onOrderPlaced(confirmation: OrderConfirmation): void;
}

type FocusRequest = { kind: "heading" } | { kind: "fields"; ids: string[] };

const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;

/** The in-app (demo) checkout: contact, shipping and review steps. No payment data is collected. */
export function LocalCheckout({ cart, policy, onOrderPlaced }: LocalCheckoutProps) {
  const { notify } = useNotifications();
  const analytics = useAnalytics();
  const { runExclusive } = useCart();
  /** The marketing opt-in is offered only when a real newsletter backend would act on it. */
  const [marketingOptInOffered] = useState(isMessagingEnabled);
  const [details, setDetails] = useState<CheckoutDetails>(() => emptyCheckoutDetails(policy));
  const [step, setStep] = useState<CheckoutStepId>("contact");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [returnToReview, setReturnToReview] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  /** Steps already reported in this checkout, so going back and resubmitting a step does not count it twice. */
  const trackedSteps = useRef(new Set<CheckoutStepId>());
  /** The province last filled in from the postal code, so a corrected code can update it again. */
  const autoProvince = useRef<string | null>(null);

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

  const trackStep = (stepId: CheckoutStepId) => {
    if (trackedSteps.current.has(stepId)) return;
    trackedSteps.current.add(stepId);
    analytics.track({
      name: "checkout_step_completed",
      properties: {
        step: CHECKOUT_STEPS.indexOf(stepId) + 1,
        step_name: stepId,
        cart_value: subtotal.amount,
        cart_item_count: cart.itemCount(),
        currency: cart.currency,
        checkout_type: "local",
      },
    });
  };

  const trackOrder = (confirmation: OrderConfirmation) => {
    const { totals: placed } = confirmation;
    // Order lines carry the display name only; the cart the order was placed from knows each variant.
    const ordered = new Map(cart.getItems().map((item) => [item.product.id.value, item.product]));
    trackStep("review");
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
        checkout_type: "local",
        products: confirmation.lines.map((line) => ({
          product_id: line.productId,
          product_name: ordered.get(line.productId)?.name ?? line.name,
          variant_title: ordered.get(line.productId)?.variantTitle ?? null,
          quantity: line.quantity,
          price: Money.fromMinor(line.unitPriceMinor, placed.total.currency).amount,
        })),
      },
    });
  };

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
    let confirmation: OrderConfirmation;
    try {
      // Inside the cart queue: drawer controls are disabled and no cart change can interleave with the order.
      confirmation = await runExclusive(() => getContainer().getPlaceOrderUseCase().execute(details));
    } catch (error) {
      setPlacing(false);
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
      if (error instanceof ValidationError) {
        // The cart was emptied meanwhile (e.g. in another tab); the flow falls back to the empty state.
        notify({ tone: "info", message: messages.cart.checkoutEmpty });
        return;
      }
      analytics.captureException(error, { area: "checkout", action: "place_order" });
      setPlaceError(messages.checkout.review.placeError);
      return;
    }
    // The order exists now: show the confirmation whatever happens to analytics. `placing` stays true so
    // the button cannot submit twice while the confirmation replaces this form.
    onOrderPlaced(confirmation);
    try {
      trackOrder(confirmation);
    } catch (error) {
      analytics.captureException(error, { area: "checkout", action: "track_order" });
    }
  };

  const updateCustomer = (patch: Partial<CustomerDetails>) =>
    setDetails((current) => ({ ...current, customer: { ...current.customer, ...patch } }));
  const updateAddress = (patch: Partial<ShippingAddress>) =>
    setDetails((current) => {
      const next = { ...current.shippingAddress, ...patch };
      // A complete postal code fills in its province unless the visitor has chosen one themselves.
      const suggested = patch.postalCode !== undefined ? provinceForPostalCode(next.postalCode) : null;
      if (suggested && (!next.province.trim() || next.province === autoProvince.current)) {
        next.province = suggested;
        autoProvince.current = suggested;
      }
      return { ...current, shippingAddress: next };
    });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
      <OrderSummary
        cart={cart}
        totals={totals}
        policy={policy}
        shippingLabel={rate ? shippingMethodLabel(rate) : undefined}
        className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1"
      />
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <CheckoutStepper current={step} onStepSelect={goBackTo} />
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-card sm:p-8">
          {step === "contact" && (
            <ContactStep
              details={details}
              errors={errors}
              headingRef={headingRef}
              onCustomerChange={updateCustomer}
              showMarketingOptIn={marketingOptInOffered}
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
