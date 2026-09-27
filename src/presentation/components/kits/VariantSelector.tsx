"use client";

import { useId } from "react";
import type { ProductVariant } from "@/domain/entities/product/Product";
import { cn } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";

export interface VariantSelectorProps {
  variants: readonly ProductVariant[];
  selectedId: string;
  onChange(variantId: string): void;
}

/**
 * The partner design's variant chips (e.g. "1 persona", "2 personas", "4 personas"),
 * built as a native radio group so it is keyboard and screen-reader friendly.
 */
export function VariantSelector({ variants, selectedId, onChange }: VariantSelectorProps) {
  const name = useId();
  const optionName = variants[0]?.options[0]?.name ?? messages.catalog.kit.people;

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2.5 text-sm font-bold text-navy-deep">{messages.catalog.kit.variantLegend(optionName)}</legend>
      <div className="flex flex-wrap gap-2.5">
        {variants.map((variant) => {
          const id = `${name}-${variant.id.value}`;
          return (
            <label
              key={variant.id.value}
              htmlFor={id}
              className={cn(
                "relative inline-flex min-h-11 cursor-pointer items-center rounded-[0.625rem] border-[1.5px] border-muted/40 bg-white px-4 text-sm font-bold text-navy-deep transition-colors",
                "hover:border-navy-deep has-checked:border-accent has-checked:bg-accent-soft has-checked:text-accent",
                "has-focus-visible:ring-2 has-focus-visible:ring-accent has-focus-visible:ring-offset-2",
              )}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={variant.id.value}
                checked={variant.id.value === selectedId}
                onChange={() => onChange(variant.id.value)}
                className="sr-only"
              />
              {variant.title}
              {!variant.inStock && <span className="ml-1.5 font-semibold text-muted">({messages.catalog.product.outOfStock})</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
