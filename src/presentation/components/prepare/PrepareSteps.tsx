import Link from "next/link";
import { cn, focusRing, textLinkClasses, ArrowRightIcon } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { cardByCode } from "@/presentation/prepare/deck";
import { SOURCES } from "@/presentation/prepare/sources";
import { routes } from "@/presentation/routes";
import { CardCodeBadge } from "./CardCodeBadge";
import { ExternalLink } from "./ExternalLink";
import { sourceLinkClasses } from "./SourceList";

const copy = messages.content.whyPrepare.steps;

/** "Prepárate en 5 pasos": numbered steps, each with its cards and one official source. */
export function PrepareSteps() {
  return (
    <ol className="grid gap-4 lg:grid-cols-2">
      {copy.items.map((step, index) => {
        const source = SOURCES[step.source];
        const cards = step.cards.map((code) => cardByCode(code)).filter((card) => card !== null);
        return (
          <li key={step.title} className={cn("flex gap-4 rounded-2xl bg-white p-5 shadow-card sm:p-6", index === 0 && "lg:col-span-2")}>
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange text-lg font-bold text-navy-deep"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="mb-1.5 text-lg text-navy-deep">{step.title}</h3>
              <p className="leading-relaxed text-muted">{step.text}</p>
              {cards.length > 0 && (
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                  <span className="text-muted">{copy.cardsLabel}</span>
                  {cards.map((card) => (
                    <Link
                      key={card.code}
                      href={routes.actionCard(card.slug)}
                      className={cn("inline-flex items-center gap-1.5 rounded-sm font-semibold text-accent underline-offset-4 hover:underline", focusRing)}
                    >
                      <CardCodeBadge code={card.code} category={card.category} />
                      {card.title}
                    </Link>
                  ))}
                </p>
              )}
              <p className="mt-2 text-sm text-muted">
                {copy.sourceLabel}{" "}
                <ExternalLink href={source.url} language={source.language} className={sourceLinkClasses}>
                  {source.organisation}
                </ExternalLink>
              </p>
              {"checklistLink" in step && (
                <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                  <Link href={routes.kitChecklist} className={textLinkClasses}>
                    {step.checklistLink}
                    <ArrowRightIcon className="size-4" />
                  </Link>
                  <Link href={routes.howToChoose} className={textLinkClasses}>
                    {step.kitsLink}
                    <ArrowRightIcon className="size-4" />
                  </Link>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
