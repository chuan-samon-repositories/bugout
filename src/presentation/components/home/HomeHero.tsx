import Image from "next/image";
import { ButtonLink, StarIcon } from "@/presentation/components/ui";
import { formatNumber, formatRating, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import type { ReviewSummary } from "./homeData";

const HERO_IMAGE = "/images/hero-trail.jpg";

export interface HomeHeroProps {
  /** Slug of the flagship product; the primary button is omitted when it is not in the catalog. */
  flagshipSlug: string | null;
  reviews: ReviewSummary | null;
}

export function HomeHero({ flagshipSlug, reviews }: HomeHeroProps) {
  const t = messages.catalog.home;

  return (
    <section className="relative isolate flex min-h-[60svh] items-center overflow-hidden bg-navy-deep lg:min-h-[70svh]">
      <Image
        src={HERO_IMAGE}
        alt={t.heroImageAlt}
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-navy-deep/95 via-navy-deep/80 to-navy-deep/50 md:bg-linear-to-r md:from-navy-deep/95 md:via-navy-deep/75 md:to-navy-deep/20"
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl text-white">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-on-navy">{t.heroEyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t.heroTitle}</h1>
          <p className="mt-5 text-lg text-white/90 sm:text-xl">{t.heroSubtitle(messages.common.tagline)}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {flagshipSlug && (
              <ButtonLink href={routes.product(flagshipSlug)} size="lg">
                {t.heroPrimary}
              </ButtonLink>
            )}
            <ButtonLink href={routes.products} size="lg" variant={flagshipSlug ? "secondary" : "primary"}>
              {t.heroSecondary}
            </ButtonLink>
          </div>
          {reviews && (
            <p className="mt-8 flex items-start gap-2 text-sm text-white/90">
              <StarIcon className="mt-px size-5 shrink-0 text-orange-on-navy" />
              <span className="min-w-0">{t.heroTrust(formatRating(reviews.average), formatNumber(reviews.count))}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
