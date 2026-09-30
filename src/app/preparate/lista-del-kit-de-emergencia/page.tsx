import type { Metadata } from "next";
import Link from "next/link";
import type { Product } from "@/domain/entities/product/Product";
import { loadCatalogOrEmpty } from "@/presentation/components/kits/loadCatalog";
import { CardCodeBadge } from "@/presentation/components/prepare/CardCodeBadge";
import { ContentNotice } from "@/presentation/components/prepare/ContentNotice";
import { PrintButton } from "@/presentation/components/prepare/PrintButton";
import { SourceList } from "@/presentation/components/prepare/SourceList";
import { ArrowRightIcon, ButtonLink, Container, PageHeader, cn, focusRing, textLinkClasses } from "@/presentation/components/ui";
import { siteConfig } from "@/presentation/config/site";
import { messages } from "@/presentation/i18n";
import { cardByCode, CONTENT_REVIEW } from "@/presentation/prepare/deck";
import {
  CHECKLIST_PEOPLE,
  CHECKLIST_SOURCES,
  drinkingWaterLitres,
  KIT_CHECKLIST,
  SELF_SUFFICIENCY_DAYS,
  WATER_LITRES_PER_PERSON_PER_DAY,
  type ChecklistItem,
} from "@/presentation/prepare/kitChecklist";
import { SOURCES } from "@/presentation/prepare/sources";
import { prepareAnchors, routes } from "@/presentation/routes";
import { JsonLd } from "@/presentation/seo/JsonLd";
import { pageMetadata } from "@/presentation/seo/pageMetadata";
import { articleJsonLd, breadcrumbJsonLd } from "@/presentation/seo/structuredData";

const copy = messages.content.whyPrepare.checklist;

/** Regenerated at most every 5 minutes: the product links follow the catalog. */
export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: copy.metaTitle,
  description: copy.metaDescription,
  path: routes.kitChecklist,
  article: { modifiedTime: CONTENT_REVIEW.updatedAt },
});

const breadcrumbs = [
  { label: messages.common.home, href: routes.home },
  { label: messages.content.whyPrepare.title, href: routes.prepare },
  { label: copy.title },
];

const linkClass = cn("inline-flex items-center gap-1.5 rounded-sm font-semibold text-accent underline-offset-4 hover:underline", focusRing);

function ItemLinks({ item, catalog }: { item: ChecklistItem; catalog: ReadonlyMap<string, Product> }) {
  const cards = (item.cards ?? []).map((code) => cardByCode(code)).filter((card) => card !== null);
  const products = (item.productSlugs ?? []).map((slug) => catalog.get(slug)).filter((product) => product !== undefined);
  if (cards.length === 0 && products.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5 text-sm print:hidden">
      {cards.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-muted">{copy.cardsLabel}</span>
          {cards.map((card) => (
            <Link key={card.code} href={routes.actionCard(card.slug)} className={linkClass}>
              <CardCodeBadge code={card.code} category={card.category} />
              {card.title}
            </Link>
          ))}
        </p>
      )}
      {products.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-muted">{copy.productsLabel}</span>
          {products.map((product) => (
            <Link key={product.slug} href={routes.product(product.slug)} className={linkClass}>
              {product.name}
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}

export default async function KitChecklistPage() {
  const products = await loadCatalogOrEmpty("the kit checklist");
  const catalog = new Map(products.map((product) => [product.slug, product]));
  const hasKits = products.some((product) => product.details?.kit && !product.isBuildYourOwn());
  const sources = CHECKLIST_SOURCES.map((id) => SOURCES[id]);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs, routes.kitChecklist, siteConfig.url),
          articleJsonLd(
            {
              headline: copy.metaTitle,
              description: copy.metaDescription,
              path: routes.kitChecklist,
              datePublished: CONTENT_REVIEW.publishedAt,
              dateModified: CONTENT_REVIEW.updatedAt,
              citations: sources.map((source) => ({ name: source.title, url: source.url, publisher: source.organisation })),
            },
            siteConfig.url,
          ),
        ]}
      />
      <PageHeader title={copy.title} description={copy.description} breadcrumbs={breadcrumbs} />
      <Container className="grid gap-10 pt-12 pb-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-10">
          <div className="flex flex-wrap items-center gap-4 print:hidden">
            <PrintButton label={copy.print} />
            <Link href={routes.prepareSection(prepareAnchors.steps)} className={textLinkClasses}>
              {copy.stepsLink}
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>

          <section aria-labelledby="water-title" className="rounded-2xl bg-white p-6 shadow-card">
            <h2 id="water-title" className="mb-2 text-xl text-navy-deep sm:text-2xl">
              {copy.waterTitle}
            </h2>
            <p className="mb-4 leading-relaxed text-muted">{copy.waterText(WATER_LITRES_PER_PERSON_PER_DAY, SELF_SUFFICIENCY_DAYS)}</p>
            <table className="w-full max-w-md border-collapse text-left">
              <caption className="sr-only">{copy.waterCaption}</caption>
              <thead>
                <tr>
                  <th scope="col" className="border-b-2 border-sand-line py-2 text-sm font-bold text-muted">
                    {copy.waterPeopleHeader}
                  </th>
                  <th scope="col" className="border-b-2 border-sand-line py-2 text-sm font-bold text-muted">
                    {copy.waterLitresHeader}
                  </th>
                </tr>
              </thead>
              <tbody>
                {CHECKLIST_PEOPLE.map((people) => (
                  <tr key={people}>
                    <th scope="row" className="border-b border-sand-line py-2 font-semibold text-ink">
                      {copy.waterPeople(people)}
                    </th>
                    <td className="border-b border-sand-line py-2 text-lg font-bold text-navy-deep tabular-nums">
                      {copy.waterLitres(drinkingWaterLitres(people))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {KIT_CHECKLIST.map((group) => (
            <section key={group.id} aria-labelledby={`${group.id}-title`}>
              <h2 id={`${group.id}-title`} className="mb-1 text-xl text-navy-deep sm:text-2xl">
                {group.title}
              </h2>
              {group.intro && <p className="mb-4 text-muted">{group.intro}</p>}
              <ul className="divide-y divide-sand-line rounded-2xl bg-white px-5 shadow-card sm:px-6">
                {group.items.map((item) => {
                  const id = `${group.id}-${item.label}`.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-");
                  return (
                    <li key={item.label} className="flex gap-3 py-4">
                      <input
                        id={id}
                        type="checkbox"
                        className="mt-1 size-5 shrink-0 cursor-pointer rounded accent-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
                      />
                      <div className="min-w-0">
                        <label htmlFor={id} className="cursor-pointer font-semibold text-ink">
                          {item.label}
                          {item.note && <span className="block text-sm font-normal text-muted">{item.note}</span>}
                        </label>
                        <ItemLinks item={item} catalog={catalog} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <p className="rounded-2xl bg-sand-dim p-5 leading-relaxed text-ink">{copy.review}</p>

          {hasKits && (
            <section aria-labelledby="kits-title" className="rounded-2xl bg-navy-deep p-7 text-sand print:hidden">
              <h2 id="kits-title" className="mb-2 text-xl text-white sm:text-2xl">
                {copy.kitsTitle}
              </h2>
              <p className="mb-5 leading-relaxed">{copy.kitsText}</p>
              <ButtonLink href={routes.howToChoose}>{copy.kitsLink}</ButtonLink>
            </section>
          )}
        </div>

        <aside aria-label={messages.content.whyPrepare.card.sources} className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
          <section aria-labelledby="sources-title" className="rounded-2xl bg-white p-6 shadow-card">
            <h2 id="sources-title" className="mb-4 text-lg text-navy-deep">
              {messages.content.whyPrepare.card.sources}
            </h2>
            <SourceList sources={sources} />
          </section>
          <ContentNotice />
        </aside>
      </Container>
    </>
  );
}
