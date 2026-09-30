import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { loadCatalogOrEmpty } from "@/presentation/components/kits/loadCatalog";
import { CardCodeBadge } from "@/presentation/components/prepare/CardCodeBadge";
import { CardLinkList } from "@/presentation/components/prepare/CardLinkList";
import { ProductGrid } from "@/presentation/components/catalog/ProductGrid";
import { Call112Box, CardFaq, CardFields, CardSteps, DontList } from "@/presentation/components/prepare/CardSections";
import { ContentNotice } from "@/presentation/components/prepare/ContentNotice";
import { SourceList } from "@/presentation/components/prepare/SourceList";
import { ArrowRightIcon, Container, PageHeader, cn, focusRing, textLinkClasses } from "@/presentation/components/ui";
import { siteConfig } from "@/presentation/config/site";
import { messages } from "@/presentation/i18n";
import { ACTION_CARDS } from "@/presentation/prepare/cards";
import { cardCategory } from "@/presentation/prepare/categories";
import {
  cardByCode,
  cardBySlug,
  cardSources,
  CONTENT_REVIEW,
  helpfulProducts,
  kitDecks,
  kitsWithCard,
  relatedCards,
} from "@/presentation/prepare/deck";
import type { ActionCard } from "@/presentation/prepare/types";
import { prepareAnchors, routes } from "@/presentation/routes";
import { JsonLd } from "@/presentation/seo/JsonLd";
import { pageMetadata, SHARE_IMAGE_SIZE } from "@/presentation/seo/pageMetadata";
import { articleJsonLd, breadcrumbJsonLd } from "@/presentation/seo/structuredData";

const copy = messages.content.whyPrepare;

/** Regenerated at most every 5 minutes: "Incluida en" follows the catalog. */
export const revalidate = 300;
/** Card codes (`/preparate/pa-04`, printed as QR codes) are not prerendered: they redirect. */
export const dynamicParams = true;

interface ActionCardPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ACTION_CARDS.map((card) => ({ slug: card.slug }));
}

/** The card for this slug. A card code redirects to its page; anything else is a 404. */
function resolveCard(slug: string): ActionCard {
  const card = cardBySlug(slug);
  if (card) return card;
  const byCode = cardByCode(slug);
  if (byCode) permanentRedirect(routes.actionCard(byCode.slug));
  notFound();
}

export async function generateMetadata({ params }: ActionCardPageProps): Promise<Metadata> {
  const card = cardBySlug((await params).slug);
  if (!card) return {};
  return pageMetadata({
    title: card.metaTitle,
    description: card.description,
    path: routes.actionCard(card.slug),
    images: [{ url: routes.actionCardShareImage(card.slug), alt: card.title, ...SHARE_IMAGE_SIZE }],
    article: { modifiedTime: CONTENT_REVIEW.updatedAt },
  });
}

export default async function ActionCardPage({ params }: ActionCardPageProps) {
  const card = resolveCard((await params).slug);
  const category = cardCategory(card.category);
  const catalog = await loadCatalogOrEmpty("an action card page");
  const kits = card.extra ? [] : kitsWithCard(card, kitDecks(catalog));
  const helpful = helpfulProducts(card, catalog);
  const breadcrumbs = [
    { label: messages.common.home, href: routes.home },
    { label: copy.title, href: routes.prepare },
    { label: card.title },
  ];
  const related = relatedCards(card);
  const sources = cardSources(card);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs, routes.actionCard(card.slug), siteConfig.url),
          articleJsonLd(
            {
              headline: card.metaTitle,
              description: card.description,
              path: routes.actionCard(card.slug),
              datePublished: CONTENT_REVIEW.publishedAt,
              dateModified: CONTENT_REVIEW.updatedAt,
              image: routes.actionCardShareImage(card.slug),
              citations: sources.map((source) => ({ name: source.title, url: source.url, publisher: source.organisation })),
            },
            siteConfig.url,
          ),
        ]}
      />
      <PageHeader title={card.title} description={card.summary} breadcrumbs={breadcrumbs} />
      <Container className="grid gap-10 pt-12 pb-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-14 lg:gap-y-10">
        <div className="flex min-w-0 flex-col gap-10">
          {card.call112 && <Call112Box id="call-112-title" text={card.call112} />}
          {card.fields ? (
            <CardFields id="fields-title" fields={card.fields} />
          ) : (
            <CardSteps id="steps-title" steps={card.steps} />
          )}
          <DontList id="dont-title" items={card.dont} />
          {card.context && card.context.length > 0 && (
            <section aria-labelledby="why-title">
              <h2 id="why-title" className="mb-3 text-xl text-navy-deep sm:text-2xl">
                {copy.card.why}
              </h2>
              <div className="space-y-3 leading-relaxed text-muted">
                {card.context.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}
          {card.faq && card.faq.length > 0 && <CardFaq id="faq-title" items={card.faq} />}
        </div>

        {/* On phones the sources come right after the card, before "Ver también". */}
        <aside
          aria-label={copy.card.code(card.code, category.name)}
          className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
        >
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <CardCodeBadge code={card.code} category={card.category} size="lg" />
            <p className="mt-3 text-sm text-muted">
              <Link
                href={routes.prepareSection(category.anchor)}
                className={cn("rounded-sm font-semibold text-navy-deep underline underline-offset-4 hover:text-accent", focusRing)}
              >
                {category.name}
              </Link>
            </p>
            {kits.length > 0 && (
              <p className="mt-4 text-sm text-muted">
                {copy.card.includedIn}:{" "}
                {kits.map((kit, index) => (
                  <span key={kit.slug}>
                    {index > 0 && " · "}
                    <Link
                      href={routes.product(kit.slug)}
                      className={cn("rounded-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-hover", focusRing)}
                    >
                      {kit.name}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>
          <section aria-labelledby="sources-title" className="rounded-2xl bg-white p-6 shadow-card">
            <h2 id="sources-title" className="mb-4 text-lg text-navy-deep">
              {copy.card.sources}
            </h2>
            <SourceList sources={sources} />
          </section>
          <ContentNotice />
          <Link href={routes.prepareSection(prepareAnchors.cards)} className={textLinkClasses}>
            {copy.card.allCards}
            <ArrowRightIcon className="size-4" />
          </Link>
        </aside>

        {related.length > 0 && (
          <section aria-labelledby="see-also-title" className="min-w-0 lg:col-start-1">
            <h2 id="see-also-title" className="mb-4 text-xl text-navy-deep sm:text-2xl">
              {copy.card.seeAlso}
            </h2>
            <CardLinkList cards={related} withCategoryName className="lg:grid-cols-2" />
          </section>
        )}

        {helpful.length > 0 && (
          <section aria-labelledby="products-title" className="min-w-0 lg:col-span-2">
            <h2 id="products-title" className="mb-2 text-xl text-navy-deep sm:text-2xl">
              {copy.card.products}
            </h2>
            <p className="mb-5 text-muted">{copy.card.productsText}</p>
            <ProductGrid products={helpful} headingLevel={3} />
          </section>
        )}
      </Container>
    </>
  );
}
