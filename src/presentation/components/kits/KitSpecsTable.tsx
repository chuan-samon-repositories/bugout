import type { ProductSpecification } from "@/domain/entities/product/Product";
import { cn } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";

export interface KitSpecsTableProps {
  rows: readonly ProductSpecification[];
  /** Visible caption naming the version the specs describe; without it the caption is for screen readers only. */
  variantCaption?: string | null;
}

/** A kit's spec table (weight, dimensions…) beside its price. */
export function KitSpecsTable({ rows, variantCaption = null }: KitSpecsTableProps) {
  const k = messages.catalog.kit;
  if (rows.length === 0) return null;
  return (
    <table className="w-full text-sm">
      <caption className={cn("caption-bottom", variantCaption ? "pt-2.5 text-left text-xs text-muted" : "sr-only")}>
        {variantCaption ? k.specsForVariant(variantCaption) : k.specs}
      </caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-sand-line">
            <th scope="row" className="w-[45%] py-2.5 pr-4 text-left align-top font-semibold text-muted">
              {row.label}
            </th>
            <td className="py-2.5 font-bold text-navy-deep">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
