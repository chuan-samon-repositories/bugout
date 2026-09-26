"use client";

import type { ComponentPropsWithRef } from "react";
import { cn } from "./cn";
import { controlClasses, FieldLabel, FieldMessages, useFieldIds, type FieldBaseProps } from "./fieldParts";

export interface TextFieldProps
  extends FieldBaseProps,
    Omit<ComponentPropsWithRef<"input">, keyof FieldBaseProps | "children"> {
  /** Extra classes for the <input> itself. */
  inputClassName?: string;
}

export function TextField({
  id,
  name,
  label,
  error,
  hint,
  required,
  className,
  inputClassName,
  type = "text",
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextFieldProps) {
  const ids = useFieldIds(id, !!hint, !!error, ariaDescribedBy);
  return (
    <div className={cn("w-full min-w-0", className)}>
      <FieldLabel htmlFor={ids.inputId} required={required}>
        {label}
      </FieldLabel>
      <input
        id={ids.inputId}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(controlClasses(!!error), inputClassName)}
        {...props}
      />
      <FieldMessages hint={hint} hintId={ids.hintId} error={error} errorId={ids.errorId} />
    </div>
  );
}
