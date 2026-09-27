"use client";

import { useId, type ReactNode } from "react";
import { cn } from "./cn";

/** Props shared by every form field primitive. */
export interface FieldBaseProps {
  /** Defaults to a stable React-generated id. */
  id?: string;
  name: string;
  label: ReactNode;
  /** Error text shown below the field; also sets aria-invalid. */
  error?: string | null;
  hint?: ReactNode;
  required?: boolean;
  /** Classes for the outer wrapper. */
  className?: string;
}

export interface FieldIds {
  inputId: string;
  hintId: string | undefined;
  errorId: string | undefined;
  describedBy: string | undefined;
}

/** Stable ids for a field, its hint and its error, plus the combined aria-describedby value. */
export function useFieldIds(
  id: string | undefined,
  hasHint: boolean,
  hasError: boolean,
  extraDescribedBy?: string,
): FieldIds {
  const generated = useId();
  const inputId = id ?? `field-${generated}`;
  const hintId = hasHint ? `${inputId}-hint` : undefined;
  const errorId = hasError ? `${inputId}-error` : undefined;
  const describedBy = [extraDescribedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { inputId, hintId, errorId, describedBy };
}

export const controlClasses = (invalid: boolean) =>
  cn(
    "block w-full min-w-0 rounded-lg border-[1.5px] bg-white px-4 py-2.5 text-base text-ink placeholder:text-muted",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:bg-sand/40 disabled:text-muted",
    invalid ? "border-danger" : "border-muted/60 hover:border-navy-deep",
  );

/** Asterisk shown next to required labels. Hidden from screen readers: `required` already conveys it. */
export function RequiredMarker({ required }: { required?: boolean }) {
  if (!required) return null;
  return (
    <span aria-hidden="true" className="ml-0.5 text-danger">
      *
    </span>
  );
}

export interface FieldLabelProps {
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FieldLabel({ htmlFor, required, children, className }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-semibold text-navy-deep", className)}>
      {children}
      <RequiredMarker required={required} />
    </label>
  );
}

export interface FieldMessagesProps {
  hint?: ReactNode;
  hintId?: string;
  error?: string | null;
  errorId?: string;
}

export function FieldMessages({ hint, hintId, error, errorId }: FieldMessagesProps) {
  return (
    <>
      {hint && hintId && (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && errorId && (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </>
  );
}
