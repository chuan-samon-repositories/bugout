"use client";

import type { MouseEvent } from "react";
import { AlertCircleIcon, cn, focusRing } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { focusField } from "./focusField";

export interface FormErrorSummaryItem {
  /** Id of the invalid control. */
  fieldId: string;
  label: string;
  message: string;
}

export interface FormErrorSummaryProps {
  /** Nothing is shown while empty; the live region stays mounted so new errors are announced. */
  errors: FormErrorSummaryItem[];
  className?: string;
}

/** List of the errors of a failed submit, each linking to its field. */
export function FormErrorSummary({ errors, className }: FormErrorSummaryProps) {
  const jumpTo = (event: MouseEvent<HTMLAnchorElement>, fieldId: string) => {
    if (focusField(fieldId)) event.preventDefault();
  };

  return (
    <div aria-live="assertive" className={className}>
      {errors.length > 0 && (
        <div className="rounded-lg border border-danger bg-white p-4">
          <p className="flex items-start gap-2 font-semibold text-danger">
            <AlertCircleIcon className="mt-0.5 size-5 shrink-0" />
            <span className="min-w-0">{messages.forms.errorSummary.title(errors.length)}</span>
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-12 text-sm text-ink">
            {errors.map((error) => (
              <li key={error.fieldId} className="break-words">
                <a
                  href={`#${error.fieldId}`}
                  onClick={(event) => jumpTo(event, error.fieldId)}
                  className={cn("rounded-sm text-danger underline underline-offset-2 hover:no-underline", focusRing)}
                >
                  {error.label}: {error.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
