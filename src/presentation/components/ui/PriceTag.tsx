import type { Money } from "@/domain/value-objects/Money";
import { formatMoney, messages } from "@/presentation/i18n";
import { cn } from "./cn";
import { VisuallyHidden } from "./VisuallyHidden";

export type PriceTagSize = "sm" | "md" | "lg";

export interface PriceTagProps {
  price: Money;
  /** Previous price; only shown when it is higher than `price` in the same currency. */
  originalPrice?: Money | null;
  size?: PriceTagSize;
  className?: string;
}

const sizeClasses: Record<PriceTagSize, { price: string; original: string; chip: string }> = {
  sm: { price: "text-base", original: "text-sm", chip: "text-xs px-1.5 py-0.5" },
  md: { price: "text-xl", original: "text-base", chip: "text-xs px-2 py-0.5" },
  lg: { price: "text-3xl", original: "text-lg", chip: "text-sm px-2 py-1" },
};

/** Whole-number discount percentage, or 0 when `original` is not a higher price in the same currency. */
export function discountPercent(price: Money, original: Money | null | undefined): number {
  if (!original || original.currency !== price.currency || !original.greaterThan(price)) return 0;
  return Math.max(0, Math.round((1 - price.minor / original.minor) * 100));
}

export function PriceTag({ price, originalPrice, size = "md", className }: PriceTagProps) {
  const onSale = !!originalPrice && originalPrice.currency === price.currency && originalPrice.greaterThan(price);
  const percent = discountPercent(price, originalPrice);
  const styles = sizeClasses[size];

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("font-bold text-ink", styles.price)}>
        {onSale && <VisuallyHidden>{messages.common.price.current}: </VisuallyHidden>}
        {formatMoney(price)}
      </span>
      {onSale && originalPrice && (
        <span className={cn("text-muted", styles.original)}>
          <VisuallyHidden>{messages.common.price.previous}: </VisuallyHidden>
          <s>{formatMoney(originalPrice)}</s>
        </span>
      )}
      {percent > 0 && (
        <span className={cn("self-center rounded-md bg-accent-soft font-semibold text-accent", styles.chip)}>
          <span aria-hidden="true">-{percent}%</span>
          <VisuallyHidden>{messages.common.price.discount(percent)}</VisuallyHidden>
        </span>
      )}
    </span>
  );
}
