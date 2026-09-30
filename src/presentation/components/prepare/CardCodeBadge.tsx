import { cn, VisuallyHidden } from "@/presentation/components/ui";
import { cardCategory } from "@/presentation/prepare/categories";
import type { CardCode, CategoryId, CategoryShape } from "@/presentation/prepare/types";

/** Background and text of each category's badges and bands (`deck-*` tokens; ink text on the amber). */
export const deckColorClasses: Record<CategoryId, string> = {
  pm: "bg-deck-pm text-white",
  cl: "bg-deck-cl text-white",
  ev: "bg-deck-ev text-white",
  na: "bg-deck-na text-ink",
  te: "bg-deck-te text-white",
  pa: "bg-deck-pa text-white",
  ad: "bg-deck-ad text-white",
};

/** A category's colour as a border (the rule under each category's heading). */
export const deckBorderClasses: Record<CategoryId, string> = {
  pm: "border-deck-pm",
  cl: "border-deck-cl",
  ev: "border-deck-ev",
  na: "border-deck-na",
  te: "border-deck-te",
  pa: "border-deck-pa",
  ad: "border-deck-ad",
};

const SHAPE_PATHS: Record<CategoryShape, string> = {
  circle: "M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2Z",
  square: "M2.5 2.5h11v11h-11z",
  arrow: "M8 1.5 14.5 13.5h-13z",
  diamond: "M8 1 15 8 8 15 1 8z",
  pentagon: "M8 1.5 14.5 6.2 12 14H4L1.5 6.2z",
  cross: "M6 1.5h4V6h4.5v4H10v4.5H6V10H1.5V6H6z",
  star: "m8 1 2.1 4.6 5 .5-3.8 3.4 1.1 5L8 12l-4.4 2.5 1.1-5L.9 6.1l5-.5z",
};

/** A category's corner shape, in currentColor. Decorative: the letters say the same. */
export function CategoryShapeIcon({ shape, className }: { shape: CategoryShape; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={cn("size-3.5 shrink-0 fill-current", className)}>
      <path d={SHAPE_PATHS[shape]} />
    </svg>
  );
}

export interface CardCodeBadgeProps {
  code: CardCode;
  category: CategoryId;
  /** Add the category name for screen readers (leave off where the category is already announced). */
  withCategoryName?: boolean;
  size?: "sm" | "lg";
  className?: string;
}

/**
 * The printed card's corner code (e.g. "PA-04") in its category's colour, with the category's shape, so it
 * reads without colour too.
 */
export function CardCodeBadge({ code, category, withCategoryName = false, size = "sm", className }: CardCodeBadgeProps) {
  const { shape, name } = cardCategory(category);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md font-bold tracking-wide tabular-nums",
        size === "lg" ? "px-3 py-1.5 text-base" : "px-2 py-0.5 text-xs",
        deckColorClasses[category],
        className,
      )}
    >
      <CategoryShapeIcon shape={shape} className={size === "lg" ? "size-4" : undefined} />
      {code}
      {withCategoryName && <VisuallyHidden>, {name}</VisuallyHidden>}
    </span>
  );
}
