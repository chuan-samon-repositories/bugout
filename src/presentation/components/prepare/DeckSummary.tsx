import Link from "next/link";
import { cn, focusRing } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { CARD_CATEGORIES } from "@/presentation/prepare/categories";
import type { KitDeck } from "@/presentation/prepare/deck";
import { routes } from "@/presentation/routes";
import { CategoryShapeIcon, deckColorClasses } from "./CardCodeBadge";

const copy = messages.content.whyPrepare.deck;

/** What each kit's printed deck holds (from the catalog), and how to read the colour, letters and shape code. */
export function DeckSummary({ kits }: { kits: readonly KitDeck[] }) {
  return (
    <div className={cn("grid gap-6", kits.length > 0 && "lg:grid-cols-2")}>
      {kits.length > 0 && (
        <ul className="space-y-4">
          {kits.map((kit) => (
            <li key={kit.slug} className="rounded-2xl bg-white p-6 shadow-card">
              <p className="leading-relaxed text-muted">
                <Link
                  href={routes.product(kit.slug)}
                  className={cn("rounded-sm font-bold text-navy-deep underline underline-offset-4 hover:text-accent", focusRing)}
                >
                  {copy.kitLine(kit.name, kit.cardCount)}
                </Link>
                : {copy.editions[kit.edition]}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <h3 className="mb-2 text-lg text-navy-deep">{copy.codeTitle}</h3>
        <p className="mb-4 leading-relaxed text-muted">{copy.codeText}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {CARD_CATEGORIES.map((category) => (
            <li key={category.id} className="flex items-center gap-3 text-sm font-semibold text-ink">
              <span
                aria-hidden="true"
                className={cn("inline-flex w-14 shrink-0 items-center justify-center gap-1 rounded-md py-1 text-xs font-bold", deckColorClasses[category.id])}
              >
                <CategoryShapeIcon shape={category.shape} className="size-3" />
                {category.id.toUpperCase()}
              </span>
              <span>
                <span className="sr-only">{category.id.toUpperCase()}: </span>
                {category.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
