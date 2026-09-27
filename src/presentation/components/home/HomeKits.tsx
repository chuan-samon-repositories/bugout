import Link from "next/link";
import type { ResolvedContentLine } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { KitCardGrid } from "@/presentation/components/kits/KitCard";
import { KitComparisonTable } from "@/presentation/components/kits/KitComparisonTable";
import { KitContentsGrid } from "@/presentation/components/kits/KitContents";
import { ArrowRightIcon, Container, Reveal, SectionHeading, textLinkClasses } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.catalog.home;

/** Spec rows the home comparison leaves out: long texts that belong on the kit page. */
export const HOME_COMPARISON_OMIT = ["Caducidad de los consumibles"];

/** Section 2: the kit cards. `id` is the hero scroll cue's target (html `scroll-padding-top` clears the header). */
export function HomeKits({ id, kits }: { id: string; kits: readonly Product[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="pt-24 pb-16 sm:pt-32">
      <Container>
        <Reveal>
          <SectionHeading
            id={`${id}-title`}
            eyebrow={copy.kitsEyebrow}
            title={copy.kitsTitle}
            description={copy.kitsDescription}
          />
        </Reveal>
        <Reveal delay={90}>
          <KitCardGrid kits={kits} />
        </Reveal>
      </Container>
    </section>
  );
}


/** Section 3: the comparison table with a link to the full "how to choose" page. */
export function HomeComparison({ kits }: { kits: readonly Product[] }) {
  return (
    <section aria-labelledby="compare-title" className="py-16 sm:py-24">
      <Container className="max-w-[55rem]">
        <Reveal>
          <SectionHeading id="compare-title" eyebrow={copy.compareEyebrow} title={copy.compareTitle} />
        </Reveal>
        <Reveal>
          <KitComparisonTable kits={kits} omitSpecs={HOME_COMPARISON_OMIT} />
        </Reveal>
        <p className="mt-7 text-center">
          <Link href={routes.howToChoose} className={textLinkClasses}>
            {copy.compareMore}
            <ArrowRightIcon className="size-4" />
          </Link>
        </p>
      </Container>
    </section>
  );
}

/** Section 4: "Qué hay dentro", the flagship kit's contents on navy. */
export function HomeInside({ kit, lines }: { kit: Product; lines: readonly ResolvedContentLine[] }) {
  return (
    <section
      aria-labelledby="inside-title"
      className="relative overflow-hidden bg-navy-deep py-24 sm:py-30 before:pointer-events-none before:absolute before:-top-[20%] before:-right-[10%] before:size-[37.5rem] before:bg-radial before:from-orange/12 before:to-transparent before:to-70%"
    >
      <Container className="relative">
        <Reveal>
          <SectionHeading
            id="inside-title"
            tone="dark"
            eyebrow={copy.insideEyebrow}
            title={copy.insideTitle}
            description={copy.insideDescription(kit.name)}
          />
        </Reveal>
        <KitContentsGrid lines={lines} />
      </Container>
    </section>
  );
}

