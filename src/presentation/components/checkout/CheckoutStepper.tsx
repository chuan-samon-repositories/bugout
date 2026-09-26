"use client";

import { CheckIcon, cn, focusRing, VisuallyHidden } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { CHECKOUT_STEPS, type CheckoutStepId } from "./checkoutFields";

export interface CheckoutStepperProps {
  current: CheckoutStepId;
  onStepSelect(step: CheckoutStepId): void;
}

const copy = messages.checkout.steps;

/** Progress through the checkout; completed steps are buttons back to that step, future steps are inert. */
export function CheckoutStepper({ current, onStepSelect }: CheckoutStepperProps) {
  const currentIndex = CHECKOUT_STEPS.indexOf(current);
  return (
    <ol aria-label={copy.label} className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {CHECKOUT_STEPS.map((step, index) => {
        const name = copy[step];
        const isCurrent = index === currentIndex;
        const isDone = index < currentIndex;
        const marker = (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              isCurrent && "bg-navy text-white",
              isDone && "bg-success text-white",
              !isCurrent && !isDone && "border-2 border-muted/50 text-muted",
            )}
          >
            {isDone ? <CheckIcon className="size-4" /> : index + 1}
          </span>
        );
        return (
          <li
            key={step}
            aria-current={isCurrent ? "step" : undefined}
            className="flex min-w-0 items-center gap-2"
          >
            {isDone ? (
              <button
                type="button"
                onClick={() => onStepSelect(step)}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-lg pr-2 text-sm font-medium text-ink underline-offset-4 hover:underline",
                  focusRing,
                )}
              >
                {marker}
                <span>{name}</span>
                <VisuallyHidden>, {copy.completed}</VisuallyHidden>
              </button>
            ) : (
              <span className={cn("flex min-h-11 items-center gap-2 text-sm", isCurrent ? "font-semibold text-ink" : "text-muted")}>
                {marker}
                <span>{name}</span>
              </span>
            )}
            {index < CHECKOUT_STEPS.length - 1 && (
              <span aria-hidden="true" className="mx-1 hidden h-px w-8 bg-muted/40 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
