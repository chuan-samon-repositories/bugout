import { compareKits, type KitComparisonRow } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { cn, focusRing } from "@/presentation/components/ui";
import { formatMoney, formatNumber, messages } from "@/presentation/i18n";

const copy = messages.catalog.kit;

function rowLabel(row: KitComparisonRow): string {
  switch (row.kind) {
    case "price":
      return copy.compareRows.price;
    case "variants":
      return row.label ?? copy.people;
    case "spec":
      return row.label;
    case "items":
      return copy.compareRows.items;
  }
}

function rowValues(row: KitComparisonRow): string[] {
  switch (row.kind) {
    case "price":
      return row.values.map((money) => formatMoney(money));
    case "variants":
      return row.values.map((values) => (values.length > 0 ? copy.peopleList(values) : copy.compareEmpty));
    case "spec":
      return row.values.map((value) => value ?? copy.compareEmpty);
    case "items":
      return row.values.map((count) => formatNumber(count));
  }
}

export interface KitComparisonTableProps {
  kits: readonly Product[];
  /** Spec labels to leave out (long texts such as the consumables expiry read badly in a table). */
  omitSpecs?: readonly string[];
  className?: string;
}

/** Narrowest useful table: the label column plus this much per kit (rem). Two kits fit a 360px phone. */
const LABEL_MIN_REM = 8;
const KIT_MIN_REM = 6;

/**
 * Side-by-side comparison of kits (the partner design's "24h vs 72h" table). On phones the
 * cells tighten and wrap so two kits fit without scrolling; with more kits the region scrolls
 * sideways (it is focusable and named, so keyboard users can scroll it too).
 */
export function KitComparisonTable({ kits, omitSpecs = [], className }: KitComparisonTableProps) {
  const rows = compareKits(kits).filter((row) => row.kind !== "spec" || !omitSpecs.includes(row.label));
  if (rows.length === 0) return null;
  const cell = "px-3 py-3 sm:px-5 sm:py-3.5";

  return (
    <div
      role="region"
      aria-label={copy.compareCaption}
      tabIndex={0}
      className={cn("max-w-full overflow-x-auto rounded-2xl bg-white shadow-card", focusRing, className)}
    >
      <table
        className="w-full border-collapse text-left text-[0.8125rem] wrap-anywhere hyphens-auto sm:text-[0.90625rem] sm:wrap-break-word"
        style={{ minWidth: `${LABEL_MIN_REM + KIT_MIN_REM * kits.length}rem` }}
      >
        <caption className="sr-only">{copy.compareCaption}</caption>
        <thead>
          <tr className="bg-navy text-[0.8125rem] tracking-[0.04em] text-sand uppercase">
            <th scope="col" className={cn(cell, "font-bold")}>
              <span className="sr-only">{copy.compareFeature}</span>
            </th>
            {kits.map((kit) => (
              <th key={kit.slug} scope="col" className={cn(cell, "font-bold")}>
                {kit.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const label = rowLabel(row);
            return (
              <tr key={`${row.kind}-${label}`} className="border-b border-sand-line last:border-b-0">
                <th scope="row" className={cn(cell, "w-2/5 align-top font-semibold text-muted")}>
                  {label}
                </th>
                {rowValues(row).map((value, index) => (
                  <td key={kits[index].slug} className={cn(cell, "align-top font-bold text-navy-deep")}>
                    {value}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
