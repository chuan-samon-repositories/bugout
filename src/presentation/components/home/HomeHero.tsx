import { ButtonLink, FrogMascot, cn, focusRing } from "@/presentation/components/ui";
import type { NavKit } from "@/presentation/components/layout/navigation";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.catalog.home;

export interface HomeHeroProps {
  /** The first two become the calls to action (Kit 24h, Kit 72h); without kits, one link to the catalog. */
  kits: readonly NavKit[];
  /** Id of the section the scroll cue jumps to. */
  scrollTargetId: string;
}

/**
 * Full-height dark hero that slides under the transparent header, with the
 * breathing frog in the corner (partner design section 1).
 */
export function HomeHero({ kits, scrollTargetId }: HomeHeroProps) {
  const [first, second] = kits;
  return (
    <section className="relative isolate -mt-(--header-height) flex min-h-svh flex-col items-center justify-center overflow-hidden bg-navy-darker px-6 pt-(--header-height) pb-24 text-center">
      <div
        aria-hidden="true"
        className="animate-hero-drift absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgb(255_120_12/0.16),transparent_60%),repeating-linear-gradient(100deg,rgb(238_232_206/0.035)_0px,rgb(238_232_206/0.035)_1px,transparent_1px,transparent_90px),linear-gradient(180deg,var(--color-navy-darker)_0%,var(--color-ink)_45%,var(--color-navy-darker)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 shadow-[inset_0_-160px_160px_-80px_rgb(0_0_0/0.6),inset_0_160px_160px_-100px_rgb(0_0_0/0.4)]"
      />
      <div className="max-w-3xl">
        <p className="mb-4 text-[0.8125rem] font-bold tracking-[0.14em] text-orange uppercase">{copy.heroEyebrow}</p>
        <h1 className="mb-6 text-[clamp(2.625rem,7vw,5.25rem)] leading-[1.02] text-sand">
          {copy.heroTitleLead}{" "}
          <br />
          <span className="text-orange">{copy.heroTitleAccent}</span>
        </h1>
        <p className="mx-auto mb-10 max-w-[35rem] text-[clamp(1rem,2vw,1.1875rem)] font-medium text-sand/80">
          {copy.heroSubtitle}
        </p>
        <div className="flex flex-col items-stretch justify-center gap-4 min-[560px]:flex-row min-[560px]:items-center">
          {first ? (
            <>
              <ButtonLink href={routes.product(first.slug)} size="lg">
                {first.label}
              </ButtonLink>
              {second && (
                <ButtonLink href={routes.product(second.slug)} size="lg" variant="outline-inverse">
                  {second.label}
                </ButtonLink>
              )}
            </>
          ) : (
            <ButtonLink href={routes.products} size="lg">
              {copy.heroFallbackCta}
            </ButtonLink>
          )}
        </div>
      </div>
      <FrogMascot className="absolute right-[4%] -bottom-2 [--frog-size:140px] drop-shadow-[0_20px_30px_rgb(0_0_0/0.45)] md:right-[6%] md:-bottom-[18px] md:[--frog-size:240px]" />
      <a
        href={`#${scrollTargetId}`}
        className={cn(
          "absolute bottom-9 left-1/2 hidden h-[42px] w-[26px] -translate-x-1/2 rounded-[20px] border-2 border-sand/40 sm:block",
          focusRing,
          "focus-visible:ring-offset-navy-darker",
        )}
      >
        <span className="sr-only">{copy.heroScroll}</span>
        <span aria-hidden="true" className="animate-scroll-dot absolute top-2 left-1/2 h-2 w-1 rounded-sm bg-orange" />
      </a>
    </section>
  );
}
