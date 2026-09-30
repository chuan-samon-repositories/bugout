import Link from "next/link";
import type { ActionCardDeck } from "@/domain/entities";
import { ArrowRightIcon, cn, textLinkClasses } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { CARD_CATEGORIES } from "@/presentation/prepare/categories";
import { deckCards } from "@/presentation/prepare/deck";
import { prepareAnchors, routes } from "@/presentation/routes";
import { CategoryShapeIcon, deckColorClasses } from "./CardCodeBadge";

const copy = messages.catalog.kit;

/** Kit page: "Incluye N tarjetas de acción", with a link to read them on the Prepárate page. */
export function KitDeckCallout({ edition, className }: { edition: ActionCardDeck; className?: string }) {
  const cards = deckCards(edition);
  const categories = CARD_CATEGORIES.filter((category) => cards.some((card) => card.category === category.id));
  return (
    <div className={cn("flex max-w-2xl flex-col gap-3 rounded-2xl bg-white p-6 shadow-card", className)}>
      <p className="flex flex-wrap gap-1.5" aria-hidden="true">
        {categories.map((category) => (
          <span key={category.id} className={cn("inline-flex size-7 items-center justify-center rounded-md", deckColorClasses[category.id])}>
            <CategoryShapeIcon shape={category.shape} />
          </span>
        ))}
      </p>
      <h3 className="text-lg text-navy-deep">{copy.actionCardsTitle(cards.length)}</h3>
      <p className="leading-relaxed text-muted">{copy.actionCardsText}</p>
      <Link href={routes.prepareSection(prepareAnchors.cards)} className={cn(textLinkClasses, "self-start")}>
        {copy.actionCardsLink}
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
  );
}
