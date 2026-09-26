"use client";

import type { ComponentPropsWithRef } from "react";
import { cn } from "./cn";
import { controlClasses, FieldLabel, FieldMessages, useFieldIds, type FieldBaseProps } from "./fieldParts";
import { ChevronDownIcon } from "./icons";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends FieldBaseProps,
    Omit<ComponentPropsWithRef<"select">, keyof FieldBaseProps> {
  /** Rendered as <option>s; alternatively pass <option> children. */
  options?: SelectOption[];
  /** Optional first, empty-valued option (e.g. "Selecciona…"). */
  placeholder?: string;
  selectClassName?: string;
}

export function SelectField({
  id,
  name,
  label,
  error,
  hint,
  required,
  className,
  selectClassName,
  options,
  placeholder,
  children,
  "aria-describedby": ariaDescribedBy,
  ...props
}: SelectFieldProps) {
  const ids = useFieldIds(id, !!hint, !!error, ariaDescribedBy);
  return (
    <div className={cn("w-full min-w-0", className)}>
      <FieldLabel htmlFor={ids.inputId} required={required}>
        {label}
      </FieldLabel>
      <div className="relative">
        <select
          id={ids.inputId}
          name={name}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cn(controlClasses(!!error), "appearance-none pr-10", selectClassName)}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options?.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
      </div>
      <FieldMessages hint={hint} hintId={ids.hintId} error={error} errorId={ids.errorId} />
    </div>
  );
}
