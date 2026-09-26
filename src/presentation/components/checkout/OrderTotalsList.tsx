import type { OrderTotals, PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { cn } from "@/presentation/components/ui";
import { formatMoney, messages } from "@/presentation/i18n";
import { formatShippingPrice, taxLabel } from "./shippingCopy";

export interface OrderTotalsListProps {
  totals: OrderTotals;
  policy: PricingPolicy;
  /** Shown next to "Envío", e.g. the selected method. */
  shippingLabel?: string;
  className?: string;
}

const copy = messages.checkout.summary;

export function OrderTotalsList({ totals, policy, shippingLabel, className }: OrderTotalsListProps) {
  const rows = [
    { label: copy.subtotal, value: formatMoney(totals.subtotal) },
    {
      label: shippingLabel ? `${copy.shipping} (${shippingLabel})` : copy.shipping,
      value: formatShippingPrice(totals.shipping),
    },
    { label: taxLabel(policy), value: formatMoney(totals.tax), muted: true },
  ];
  return (
    <dl className={cn("space-y-2 text-sm", className)}>
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4">
          <dt className={cn("min-w-0", row.muted ? "text-muted" : "text-ink")}>{row.label}</dt>
          <dd className={cn("shrink-0 tabular-nums", row.muted ? "text-muted" : "text-ink")}>{row.value}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-muted/30 pt-3 text-base font-bold text-ink">
        <dt>{copy.total}</dt>
        <dd className="shrink-0 tabular-nums">{formatMoney(totals.total)}</dd>
      </div>
    </dl>
  );
}
