"use client";

import type { ChangeEvent, ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "./cn";
import { FieldMessages, RequiredMarker, useFieldIds, type FieldBaseProps } from "./fieldParts";

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  /** Right-aligned text, e.g. a price. */
  aside?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupFieldProps
  extends FieldBaseProps,
    Omit<ComponentPropsWithRef<"fieldset">, keyof FieldBaseProps | "children" | "onChange" | "defaultValue"> {
  options: RadioOption[];
  /** Controlled selected value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  onValueChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
}

/** Radio options inside a fieldset/legend; `label` is the legend. Ref goes to the <fieldset>. */
export function RadioGroupField({
  id,
  name,
  label,
  error,
  hint,
  required,
  className,
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  "aria-describedby": ariaDescribedBy,
  ...props
}: RadioGroupFieldProps) {
  const ids = useFieldIds(id, !!hint, !!error, ariaDescribedBy);
  const controlled = value !== undefined;

  return (
    <fieldset
      id={ids.inputId}
      aria-describedby={ids.describedBy}
      aria-invalid={error ? true : undefined}
      disabled={disabled}
      className={cn("w-full min-w-0", className)}
      {...props}
    >
      <legend className="mb-2 text-sm font-medium text-ink">
        {label}
        <RequiredMarker required={required} />
      </legend>
      <div className="flex flex-col gap-2">
        {options.map((option, index) => {
          const optionId = `${ids.inputId}-option-${index}`;
          const descriptionId = option.description ? `${optionId}-description` : undefined;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                "flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border bg-white p-4 transition-colors",
                "has-checked:border-accent has-checked:bg-accent-soft",
                "has-focus-visible:ring-2 has-focus-visible:ring-accent has-focus-visible:ring-offset-2",
                "has-disabled:cursor-not-allowed has-disabled:opacity-60",
                error ? "border-danger" : "border-muted/40 hover:border-navy",
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                required={required}
                disabled={option.disabled}
                aria-describedby={descriptionId}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent focus-visible:outline-none"
                {...(controlled
                  ? { checked: option.value === value }
                  : defaultValue !== undefined
                    ? { defaultChecked: option.value === defaultValue }
                    : {})}
                onChange={(event) => onValueChange?.(event.target.value, event)}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink">{option.label}</span>
                {option.description && (
                  <span id={descriptionId} className="mt-0.5 block text-sm text-muted">
                    {option.description}
                  </span>
                )}
              </span>
              {option.aside && <span className="shrink-0 font-semibold text-ink">{option.aside}</span>}
            </label>
          );
        })}
      </div>
      <FieldMessages hint={hint} hintId={ids.hintId} error={error} errorId={ids.errorId} />
    </fieldset>
  );
}
