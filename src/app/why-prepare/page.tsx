import type { Metadata } from "next";
import { navData } from "@/presentation/components/layout/navigation";
import { loadCatalogOrEmpty } from "@/presentation/components/kits/loadCatalog";
import { CardIndex } from "@/presentation/components/prepare/CardIndex";
import { ContentNotice } from "@/presentation/components/prepare/ContentNotice";
import { DeckSummary } from "@/presentation/components/prepare/DeckSummary";
import { EmergencyNumbers } from "@/presentation/components/prepare/EmergencyNumbers";
import { ExternalLink } from "@/presentation/components/prepare/ExternalLink";
import { PrepareSteps } from "@/presentation/components/prepare/PrepareSteps";
import { sourceLinkClasses } from "@/presentation/components/prepare/SourceList";
import { ArrowRightIcon, ButtonLink, Container, PageHeader, SectionHeading } from "@/presentation/components/ui";
import { siteConfig } from "@/presentation/config/site";
import { messages } from "@/presentation/i18n";
import { cardByCode, citedOrganisations, kitDecks } from "@/presentation/prepare/deck";
import { SOURCES } from "@/presentation/prepare/sources";
import { prepareAnchors, routes } from "@/presentation/routes";
import { JsonLd } from "@/presentation/seo/JsonLd";
import { pageMetadata } from "@/presentation/seo/pageMetadata";
import { breadcrumbJsonLd } from "@/presentation/seo/structuredData";

const copy = messages.content.whyPrepare;

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: copy.metaTitle,
  description: copy.metaDescription,
  path: routes.whyPrepare,
});

const breadcrumbs = [{ label: messages.common.home, href: routes.home }, { label: copy.title }];

const sectionClass = "scroll-mt-28";

export default async function WhyPreparePage() {
  const products = await loadCatalogOrEmpty("the why-prepare page");
  const [first, second] = navData(products).kits;
  const decks = kitDecks(products);
  const firstMinutes = cardByCode("PM-01");

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, routes.whyPrepare, siteConfig.url)} />
      <PageHeader title={copy.title} description={copy.description} breadcrumbs={breadcrumbs} />
      <Container className="flex flex-col gap-20 pt-14 pb-24 sm:gap-24 sm:pt-16">
        <section id={prepareAnchors.startHere} aria-labelledby="start-here-title" className={sectionClass}>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl bg-navy-deep p-7 text-sand sm:p-9">
              <p className="mb-2 text-xs font-bold tracking-[0.18em] text-orange-on-navy uppercase">{copy.startHere.eyebrow}</p>
              <h2 id="start-here-title" className="mb-4 text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight text-white">
                {copy.startHere.title}
              </h2>
              <p className="mb-6 max-w-xl text-lg leading-relaxed">{copy.startHere.text}</p>
              {firstMinutes && (
                <ButtonLink href={routes.actionCard(firstMinutes.slug)} size="lg">
                  {copy.startHere.cardCta}
                  <ArrowRightIcon className="size-5" />
                </ButtonLink>
              )}
            </div>
            <EmergencyNumbers />
          </div>
        </section>

        <section id={prepareAnchors.why} aria-labelledby="why-title" className={sectionClass}>
          <SectionHeading id="why-title" eyebrow={copy.why.eyebrow} title={copy.why.title} description={copy.why.description} />
          <ul className="grid gap-4 md:grid-cols-3">
            {copy.why.items.map((item) => {
              const source = SOURCES[item.source];
              return (
                <li key={item.title} className="flex flex-col rounded-2xl bg-white p-6 shadow-card">
                  <h3 className="mb-2 text-lg text-navy-deep">{item.title}</h3>
                  <p className="mb-4 flex-1 leading-relaxed text-muted">{item.text}</p>
                  <p className="text-sm text-muted">
                    {copy.steps.sourceLabel}{" "}
                    <ExternalLink href={source.url} language={source.language} className={sourceLinkClasses}>
                      {source.organisation}
                    </ExternalLink>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section id={prepareAnchors.steps} aria-labelledby="steps-title" className={sectionClass}>
          <SectionHeading id="steps-title" eyebrow={copy.steps.eyebrow} title={copy.steps.title} description={copy.steps.description} />
          <PrepareSteps />
        </section>

        <section id={prepareAnchors.cards} aria-labelledby="cards-title" className={sectionClass}>
          <SectionHeading id="cards-title" eyebrow={copy.cards.eyebrow} title={copy.cards.title} description={copy.cards.description} />
          <CardIndex />
        </section>

        <section id={prepareAnchors.kitDeck} aria-labelledby="deck-title" className={sectionClass}>
          <SectionHeading
            id="deck-title"
            eyebrow={decks.length > 0 ? copy.deck.eyebrow : undefined}
            title={decks.length > 0 ? copy.deck.title : copy.deck.codeTitle}
            description={decks.length > 0 ? copy.deck.description : undefined}
          />
          <DeckSummary kits={decks} />
        </section>

        <section id={prepareAnchors.sources} aria-labelledby="sources-title" className={sectionClass}>
          <SectionHeading id="sources-title" eyebrow={copy.sources.eyebrow} title={copy.sources.title} description={copy.sources.text} />
          <div className="mx-auto max-w-3xl space-y-6">
            <ul className="flex flex-wrap justify-center gap-2">
              {citedOrganisations().map((organisation) => (
                <li key={organisation} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-deep shadow-card">
                  {organisation}
                </li>
              ))}
            </ul>
            <p className="text-center leading-relaxed text-muted">
              {copy.sources.firstAid}{" "}
              <ExternalLink href={SOURCES.ercGuidelines.url} language={SOURCES.ercGuidelines.language} className={sourceLinkClasses}>
                {SOURCES.ercGuidelines.title}
              </ExternalLink>
            </p>
            <p className="text-center leading-relaxed text-muted">
              {copy.sources.course}{" "}
              <ExternalLink href={SOURCES.cruzRojaCourses.url} className={sourceLinkClasses}>
                {copy.sources.courseLink}
              </ExternalLink>
              .
            </p>
            <ContentNotice />
          </div>
        </section>

        {first && (
          <section aria-labelledby="kits-cta-title" className="text-center">
            <h2 id="kits-cta-title" className="mb-6 text-[clamp(1.5rem,3vw,2rem)] text-navy-deep">
              {copy.ctaTitle}
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href={routes.product(first.slug)}>{first.label}</ButtonLink>
              {second && (
                <ButtonLink href={routes.product(second.slug)} variant="secondary">
                  {second.label}
                </ButtonLink>
              )}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
