import Link from "next/link";
import { CloseIcon, cn, focusRing, PhoneIcon } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { cardByCode } from "@/presentation/prepare/deck";
import type { CardStep } from "@/presentation/prepare/types";
import { routes } from "@/presentation/routes";
import { CardCodeBadge } from "./CardCodeBadge";

const copy = messages.content.whyPrepare.card;

const sectionTitle = "mb-4 text-xl text-navy-deep sm:text-2xl";

/** "Qué hacer": the card's steps, large and numbered, each with links to the cards it points to. */
export function CardSteps({ steps, id }: { steps: readonly CardStep[]; id: string }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className={sectionTitle}>
        {copy.whatToDo}
      </h2>
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step.text} className="flex gap-4 rounded-2xl bg-white p-4 shadow-card sm:p-5">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy-deep text-lg font-bold text-white"
            >
              {index + 1}
            </span>
            <div className="min-w-0 self-center">
              <p className="text-[1.0625rem] leading-snug font-semibold text-ink">{step.text}</p>
              {step.see && step.see.length > 0 && <SeeLinks codes={step.see} />}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SeeLinks({ codes }: { codes: readonly string[] }) {
  const cards = codes.map((code) => cardByCode(code)).filter((card) => card !== null);
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
      <span>{copy.see}:</span>
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
  );
}

/** "Qué apuntar": the fill-in fields of the family sheet. */
export function CardFields({ fields, id }: { fields: readonly string[]; id: string }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className={sectionTitle}>
        {copy.fields}
      </h2>
      <ul className="divide-y divide-sand-line rounded-2xl bg-white px-5 shadow-card">
        {fields.map((field) => (
          <li key={field} className="py-3 font-semibold text-ink">
            {field}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "No hagas": the common mistakes, each with a cross. */
export function DontList({ items, id }: { items: readonly string[]; id: string }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border-2 border-danger bg-white p-5 sm:p-6">
      <h2 id={id} className="mb-3 text-xl text-danger sm:text-2xl">
        {copy.dont}
      </h2>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-3 font-semibold text-ink">
            <CloseIcon className="mt-0.5 size-5 shrink-0 text-danger" strokeWidth={2.5} />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Llama al 112 si…", in red, with a tap-to-call link. */
export function Call112Box({ text, id }: { text: string; id: string }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl bg-danger p-5 text-white sm:p-6">
      <h2 id={id} className="mb-2 flex items-center gap-2.5 text-xl text-white sm:text-2xl">
        <PhoneIcon className="size-6 shrink-0" />
        {copy.call112}
      </h2>
      <p className="text-[1.0625rem] leading-snug font-semibold">{text}</p>
      <a
        href="tel:112"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-danger focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-danger focus-visible:outline-none"
      >
        <PhoneIcon className="size-4" />
        {copy.callNow}
      </a>
    </section>
  );
}
