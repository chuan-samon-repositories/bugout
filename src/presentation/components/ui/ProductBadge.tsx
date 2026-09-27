import { messages } from "@/presentation/i18n";
import { cn } from "./cn";

type KnownBadge = keyof typeof messages.common.badges;

const badgeStyles: Record<KnownBadge, string> = {
  BESTSELLER: "bg-orange text-navy-deep",
  PREMIUM: "bg-navy text-white",
  SALE: "bg-danger text-white",
};

const neutralStyle = "bg-sand text-ink";

function isKnownBadge(value: string): value is KnownBadge {
  return Object.prototype.hasOwnProperty.call(messages.common.badges, value);
}

export interface ProductBadgeProps {
  badge: string;
  className?: string;
}

/** Merchandising badge. Known codes are translated; anything else renders as-is in a neutral style. */
export function ProductBadge({ badge, className }: ProductBadgeProps) {
  const raw = badge.trim();
  if (!raw) return null;
  const key = raw.toUpperCase();
  const known = isKnownBadge(key);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-extrabold uppercase tracking-[0.06em]",
        known ? badgeStyles[key] : neutralStyle,
        className,
      )}
    >
      {known ? messages.common.badges[key] : raw}
    </span>
  );
}
