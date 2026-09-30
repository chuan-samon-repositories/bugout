import Link from "next/link";
import { cn, focusRing } from "@/presentation/components/ui";
import type { ActionCard } from "@/presentation/prepare/types";
import { routes } from "@/presentation/routes";
import { CardCodeBadge } from "./CardCodeBadge";

export interface CardLinkListProps {
  cards: readonly ActionCard[];
  /** Announce each card's category (for lists that mix categories). */
  withCategoryName?: boolean;
  /** Show each card's one-line summary. */
  withSummary?: boolean;
  className?: string;
}

/** A grid of white cards linking to action cards: code badge, title and, optionally, the summary. */
export function CardLinkList({ cards, withCategoryName = false, withSummary = true, className }: CardLinkListProps) {
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {cards.map((card) => (
        <li key={card.code} className="min-w-0">
          <Link
            href={routes.actionCard(card.slug)}
            className={cn(
              "group flex h-full flex-col gap-2 rounded-2xl bg-white p-4 shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0",
              focusRing,
            )}
          >
            <CardCodeBadge code={card.code} category={card.category} withCategoryName={withCategoryName} className="self-start" />
            <span className="font-bold leading-snug text-navy-deep group-hover:underline group-hover:underline-offset-4">
              {card.title}
            </span>
            {withSummary && <span className="text-sm leading-snug text-muted">{card.summary}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
