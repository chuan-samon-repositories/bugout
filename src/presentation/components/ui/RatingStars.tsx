import type { ProductRating } from "@/domain/entities/product/Product";
import { formatNumber, formatRating, messages } from "@/presentation/i18n";
import { cn } from "./cn";
import { StarIcon, type StarFill } from "./icons";

export type RatingStarsSize = "sm" | "md" | "lg";

export interface RatingStarsProps {
  /** Hidden entirely when null or when there are no reviews. */
  rating: ProductRating | null;
  size?: RatingStarsSize;
  /** Show the average and review count next to the stars. */
  showCount?: boolean;
  className?: string;
}

const starSize: Record<RatingStarsSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

const textSize: Record<RatingStarsSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

/** Fill for each of the five stars, rounding the average to the nearest half star. */
export function starFills(average: number): StarFill[] {
  const rounded = Math.min(5, Math.max(0, Math.round(average * 2) / 2));
  return Array.from({ length: 5 }, (_, index) => {
    if (rounded >= index + 1) return "full";
    if (rounded >= index + 0.5) return "half";
    return "empty";
  });
}

export function RatingStars({ rating, size = "md", showCount = false, className }: RatingStarsProps) {
  if (!rating || rating.count <= 0) return null;

  const average = formatRating(rating.average);
  const count = formatNumber(rating.count);
  const label = messages.common.rating.label(average, rating.count, count);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span role="img" aria-label={label} className="inline-flex items-center gap-0.5 text-accent">
        {starFills(rating.average).map((fill, index) => (
          <StarIcon key={index} fill={fill} className={starSize[size]} />
        ))}
      </span>
      {showCount && (
        <span aria-hidden="true" className={cn("text-muted", textSize[size])}>
          <span className="font-semibold text-ink">{average}</span> ·{" "}
          {messages.common.rating.count(rating.count, count)}
        </span>
      )}
    </span>
  );
}
