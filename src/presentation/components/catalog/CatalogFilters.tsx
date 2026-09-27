"use client";

import type { FilterCriteria } from "@/application/dtos/FilterCriteria";
import { Button, CheckboxField, TextField } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";

export interface CatalogFiltersProps {
  criteria: FilterCriteria;
  minText: string;
  maxText: string;
  /** Placeholders for the price inputs, from the catalog's price range. */
  bounds: { min: number; max: number } | null;
  /** Formatted range hint, e.g. "Precios entre 39,00 € y 299,00 €". */
  rangeHint: string | null;
  showSwapHint: boolean;
  activeCount: number;
  onMinTextChange(value: string): void;
  onMaxTextChange(value: string): void;
  onInStockChange(value: boolean): void;
  onSaleChange(value: boolean): void;
  onClear(): void;
}

export function CatalogFilters({
  criteria,
  minText,
  maxText,
  bounds,
  rangeHint,
  showSwapHint,
  activeCount,
  onMinTextChange,
  onMaxTextChange,
  onInStockChange,
  onSaleChange,
  onClear,
}: CatalogFiltersProps) {
  const t = messages.catalog.filters;

  return (
    <div className="grid gap-6 rounded-2xl bg-white p-5 shadow-card sm:grid-cols-2 sm:p-6 lg:grid-cols-[1.4fr_1fr_auto] lg:items-start">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-bold text-navy-deep">{t.price}</legend>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            name="min"
            label={t.priceMin}
            type="number"
            inputMode="numeric"
            min={0}
            step="any"
            placeholder={bounds ? String(bounds.min) : undefined}
            value={minText}
            onChange={(event) => onMinTextChange(event.target.value)}
          />
          <TextField
            name="max"
            label={t.priceMax}
            type="number"
            inputMode="numeric"
            min={0}
            step="any"
            placeholder={bounds ? String(bounds.max) : undefined}
            value={maxText}
            onChange={(event) => onMaxTextChange(event.target.value)}
          />
        </div>
        {rangeHint && <p className="mt-2 text-sm text-muted">{rangeHint}</p>}
        {showSwapHint && (
          <p className="mt-2 text-sm text-ink" role="status">
            {t.priceSwapped}
          </p>
        )}
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="mb-2 text-sm font-bold text-navy-deep">{t.availability}</legend>
        <CheckboxField
          name="stock"
          label={t.inStockOnly}
          checked={!!criteria.inStockOnly}
          onChange={(event) => onInStockChange(event.target.checked)}
        />
        <CheckboxField
          name="sale"
          label={t.onSaleOnly}
          checked={!!criteria.onSaleOnly}
          onChange={(event) => onSaleChange(event.target.checked)}
        />
      </fieldset>

      {activeCount > 0 && (
        <Button variant="secondary" size="sm" onClick={onClear} className="self-start lg:self-end">
          {t.clear}
        </Button>
      )}
    </div>
  );
}
