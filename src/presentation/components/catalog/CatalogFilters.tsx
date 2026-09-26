"use client";

import type { CategorySummary } from "@/application/catalog";
import type { FilterCriteria } from "@/application/dtos/FilterCriteria";
import { Button, CheckboxField, RadioGroupField, TextField } from "@/presentation/components/ui";
import { formatNumber, messages } from "@/presentation/i18n";
import { categoryLabel } from "./categoryLabel";

const ALL_CATEGORIES = "";

export interface CatalogFiltersProps {
  criteria: FilterCriteria;
  categories: readonly CategorySummary[];
  totalCount: number;
  minText: string;
  maxText: string;
  /** Placeholders for the price inputs, from the catalog's price range. */
  bounds: { min: number; max: number } | null;
  /** Formatted range hint, e.g. "Precios entre 39,00 € y 299,00 €". */
  rangeHint: string | null;
  showSwapHint: boolean;
  activeCount: number;
  onCategoryChange(category: string | undefined): void;
  onMinTextChange(value: string): void;
  onMaxTextChange(value: string): void;
  onInStockChange(value: boolean): void;
  onSaleChange(value: boolean): void;
  onClear(): void;
}

export function CatalogFilters({
  criteria,
  categories,
  totalCount,
  minText,
  maxText,
  bounds,
  rangeHint,
  showSwapHint,
  activeCount,
  onCategoryChange,
  onMinTextChange,
  onMaxTextChange,
  onInStockChange,
  onSaleChange,
  onClear,
}: CatalogFiltersProps) {
  const t = messages.catalog.filters;
  const countAside = (count: number) => <span className="text-sm font-normal text-muted">{formatNumber(count)}</span>;

  return (
    <div className="flex flex-col gap-6">
      <RadioGroupField
        name="category"
        label={t.category}
        value={criteria.category ?? ALL_CATEGORIES}
        onValueChange={(value) => onCategoryChange(value || undefined)}
        options={[
          { value: ALL_CATEGORIES, label: t.allCategories, aside: countAside(totalCount) },
          ...categories.map((category) => ({
            value: category.slug,
            label: categoryLabel(category.slug),
            aside: countAside(category.count),
          })),
        ]}
      />

      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-medium text-ink">{t.price}</legend>
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
        <legend className="mb-2 text-sm font-medium text-ink">{t.availability}</legend>
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
        <Button variant="secondary" size="sm" onClick={onClear} className="self-start">
          {t.clear}
        </Button>
      )}
    </div>
  );
}
