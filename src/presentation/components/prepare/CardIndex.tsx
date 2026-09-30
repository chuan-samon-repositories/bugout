import { cn, focusRing } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { cardsByCategory } from "@/presentation/prepare/deck";
import { CategoryShapeIcon, deckBorderClasses, deckColorClasses } from "./CardCodeBadge";
import { CardLinkList } from "./CardLinkList";

const copy = messages.content.whyPrepare.cards;

/** "Tarjetas de acción": jump links to each category, then every card grouped by category. */
export function CardIndex() {
  const groups = cardsByCategory().filter((group) => group.cards.length > 0);
  return (
    <>
      <nav aria-label={copy.jumpLabel} className="mb-12">
        <ul className="flex flex-wrap justify-center gap-2">
          {groups.map(({ category }) => (
            <li key={category.id}>
              <a
                href={`#${category.anchor}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-opacity hover:opacity-90",
                  deckColorClasses[category.id],
                  focusRing,
                )}
              >
                <CategoryShapeIcon shape={category.shape} />
                {category.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-14">
        {groups.map(({ category, cards }) => (
          <section key={category.id} id={category.anchor} aria-labelledby={`${category.anchor}-title`} className="scroll-mt-28">
            <div className={cn("mb-5 flex items-center gap-4 border-b-4 pb-3", deckBorderClasses[category.id])}>
              <span aria-hidden="true" className={cn("flex size-10 items-center justify-center rounded-lg", deckColorClasses[category.id])}>
                <CategoryShapeIcon shape={category.shape} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id={`${category.anchor}-title`} className="text-xl text-navy-deep sm:text-2xl">
                  {category.name}{" "}
                  <span className="text-base font-semibold whitespace-nowrap text-muted">
                    · {category.id.toUpperCase()} · {copy.count(cards.length)}
                  </span>
                </h3>
                <p className="text-sm text-muted">{category.description}</p>
              </div>
            </div>
            {cards.some((card) => card.extra) && <p className="mb-4 text-sm font-semibold text-muted">{copy.extrasNote}</p>}
            <CardLinkList cards={cards} />
          </section>
        ))}
      </div>
    </>
  );
}
