"use client";

import type { FormEvent, ReactNode, Ref } from "react";
import { FormErrorSummary, type FormErrorSummaryItem } from "@/presentation/components/forms/FormErrorSummary";

export interface StepFormProps {
  title: string;
  headingRef: Ref<HTMLHeadingElement>;
  errors: FormErrorSummaryItem[];
  onSubmit(): void;
  children: ReactNode;
  /** Buttons row (submit, back). */
  actions: ReactNode;
}

/** One checkout step: focusable heading, error summary, the fields and the actions. */
export function StepForm({ title, headingRef, errors, onSubmit, children, actions }: StepFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <form noValidate onSubmit={handleSubmit} aria-labelledby="checkout-step-heading" className="min-w-0">
      <h2
        id="checkout-step-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl text-navy-deep focus-visible:outline-none"
      >
        {title}
      </h2>
      <FormErrorSummary errors={errors} className={errors.length > 0 ? "mt-4" : undefined} />
      {/* ph-no-capture: PostHog autocapture never records what the customer types or selects here. */}
      <div className="ph-no-capture mt-6 flex flex-col gap-5">{children}</div>
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">{actions}</div>
    </form>
  );
}
