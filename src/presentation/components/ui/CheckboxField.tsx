"use client";

import type { ComponentPropsWithRef } from "react";
import { cn } from "./cn";
import { FieldMessages, RequiredMarker, useFieldIds, type FieldBaseProps } from "./fieldParts";

export interface CheckboxFieldProps
  extends FieldBaseProps,
    Omit<ComponentPropsWithRef<"input">, keyof FieldBaseProps | "type" | "children"> {}

export function CheckboxField({
  id,
  name,
  label,
  error,
  hint,
  required,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: CheckboxFieldProps) {
  const ids = useFieldIds(id, !!hint, !!error, ariaDescribedBy);
  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="flex items-start gap-3">
        <input
          id={ids.inputId}
          name={name}
          type="checkbox"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cn(
            "mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed",
          )}
          {...props}
        />
        <label htmlFor={ids.inputId} className="min-w-0 cursor-pointer text-sm text-ink">
          {label}
          <RequiredMarker required={required} />
        </label>
      </div>
      <div className="pl-8">
        <FieldMessages hint={hint} hintId={ids.hintId} error={error} errorId={ids.errorId} />
      </div>
    </div>
  );
}
