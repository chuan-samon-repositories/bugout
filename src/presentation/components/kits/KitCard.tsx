import Link from "next/link";
import type { Product } from "@/domain/entities/product/Product";
import { buttonClasses, cn } from "@/presentation/components/ui";
import { formatMoney, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.catalog.kit;

/** Header gradients cycled across kit cards, as in the partner design (navy, orange, deep navy). */
const MEDIA_TONES = [
  "from-navy to-navy-deep",
  "from-orange to-orange-deep",
  "from-navy-deep to-navy-darker",
] as const;

/** People options of a kit, e.g. "1, 2 o 4"; null for a single-variant kit. */
export function peopleSummary(kit: Product): string | null {
  if (!kit.hasVariants()) return null;
  return copy.peopleList(kit.variants.map((variant) => variant.options[0]?.value ?? variant.title));
}

/** "Desde 39,00 €" when the kit has several prices or is a build-your-own base; otherwise the price. */
export function kitPriceLabel(kit: Product): string {
  const { min } = kit.priceRange();
  return kit.hasPriceRange() || kit.details?.kit?.buildYourOwn ? copy.fromPrice(formatMoney(min)) : formatMoney(min);
}

export interface KitCardProps {
  kit: Product;
  /** Position in the grid, used to pick the header gradient. */
  index: number;
  headingLevel?: 2 | 3;
}

/** The partner design's kit card: gradient header with the kit label, facts, price and "Ver el kit". */
export function KitCard({ kit, index, headingLevel = 3 }: KitCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const people = peopleSummary(kit);
  const weight = kit.details?.specifications.find((spec) => /^peso$/i.test(spec.label));

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-kit bg-white shadow-card",
        "transition-[transform,box-shadow] duration-350 ease-brand motion-safe:hover:-translate-y-2 hover:shadow-lift",
      )}
    >
      <div
        className={cn(
          "relative flex h-40 items-start justify-end bg-linear-135 p-4",
          "after:absolute after:inset-0 after:bg-[repeating-linear-gradient(115deg,rgb(255_255_255/0.05)_0_2px,transparent_2px_40px)]",
          MEDIA_TONES[index % MEDIA_TONES.length],
        )}
      >
        {kit.details?.kit && (
          <span className="relative z-10 rounded-full bg-navy-deep/85 px-3.5 py-1.5 text-xs font-extrabold tracking-[0.08em] text-sand">
            {kit.details.kit.label}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6 pb-7">
        <Heading className="mb-2 text-[1.3125rem] text-navy-deep">{kit.name}</Heading>
        <p className="mb-4 text-sm text-muted">{kit.description}</p>
        <ul className="mb-5 flex-1 space-y-1 text-[0.8125rem] text-muted">
          {people && (
            <li>
              {copy.people}: {people}
            </li>
          )}
          {weight && (
            <li>
              {weight.label}: {weight.value}
            </li>
          )}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xl font-extrabold text-navy-deep">{kitPriceLabel(kit)}</p>
          {/* The label starts with the visible text, so voice control users can say "Ver el kit". */}
          <Link href={routes.product(kit.slug)} aria-label={`${copy.view}: ${kit.name}`} className={buttonClasses({ size: "sm" })}>
            {copy.view}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function KitCardGrid({ kits, headingLevel }: { kits: readonly Product[]; headingLevel?: 2 | 3 }) {
  return (
    <ul className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
      {kits.map((kit, index) => (
        <li key={kit.slug} className="min-w-0">
          <KitCard kit={kit} index={index} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
