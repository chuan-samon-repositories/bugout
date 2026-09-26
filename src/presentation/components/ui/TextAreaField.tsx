"use client";

import type { ComponentPropsWithRef } from "react";
import { cn } from "./cn";
import { controlClasses, FieldLabel, FieldMessages, useFieldIds, type FieldBaseProps } from "./fieldParts";

export interface TextAreaFieldProps
  extends FieldBaseProps,
    Omit<ComponentPropsWithRef<"textarea">, keyof FieldBaseProps | "children"> {
  textareaClassName?: string;
}

export function TextAreaField({
  id,
  name,
  label,
  error,
  hint,
  required,
  className,
  textareaClassName,
  rows = 4,
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextAreaFieldProps) {
  const ids = useFieldIds(id, !!hint, !!error, ariaDescribedBy);
  return (
    <div className={cn("w-full min-w-0", className)}>
      <FieldLabel htmlFor={ids.inputId} required={required}>
        {label}
      </FieldLabel>
      <textarea
        id={ids.inputId}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(controlClasses(!!error), "resize-y", textareaClassName)}
        {...props}
      />
      <FieldMessages hint={hint} hintId={ids.hintId} error={error} errorId={ids.errorId} />
    </div>
  );
}
