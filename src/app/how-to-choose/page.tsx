import type { Metadata } from "next";
import { comparableKits, kitsIn } from "@/application/catalog";
import { KitCardGrid } from "@/presentation/components/kits/KitCard";
import { KitComparisonTable } from "@/presentation/components/kits/KitComparisonTable";
import { loadCatalogOrEmpty } from "@/presentation/components/kits/loadCatalog";
import { ButtonLink, Container, PageHeader } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.content.howToChoose;

/** Built from the catalog: regenerate with the product pages. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.metaDescription,
  alternates: { canonical: routes.howToChoose },
};

const sectionTitle = "mb-6 text-[clamp(1.5rem,3vw,2rem)] text-navy-deep";

export default async function HowToChoosePage() {
  const products = await loadCatalogOrEmpty("the how-to-choose page");
  const kits = kitsIn(products);
  const compared = comparableKits(products);
  const withAudience = kits.filter((kit) => kit.details?.kit?.idealFor);

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
        breadcrumbs={[{ label: messages.common.home, href: routes.home }, { label: copy.title }]}
      />
      <Container className="flex flex-col gap-20 py-16 sm:py-20">
        {kits.length === 0 && (
          <section
            aria-labelledby="no-kits-title"
            className="mx-auto w-full max-w-[47.5rem] rounded-2xl bg-white px-7 py-10 text-center shadow-card"
          >
            <h2 id="no-kits-title" className="mb-3 text-xl text-navy-deep">
              {copy.emptyTitle}
            </h2>
            <p className="mb-6 text-[0.9375rem] text-muted">{copy.emptyText}</p>
            <ButtonLink href={routes.products}>{copy.emptyCta}</ButtonLink>
          </section>
        )}

        {compared.length > 0 && (
          <section aria-labelledby="compare-title" className="mx-auto w-full max-w-[55rem]">
            <h2 id="compare-title" className={sectionTitle}>
              {copy.compareTitle}
            </h2>
            <KitComparisonTable kits={compared} />
          </section>
        )}

        {withAudience.length > 0 && (
          <section aria-labelledby="for-whom-title" className="mx-auto w-full max-w-[47.5rem]">
            <h2 id="for-whom-title" className={sectionTitle}>
              {copy.forWhomTitle}
            </h2>
            <ul className="flex flex-col gap-5">
              {withAudience.map((kit) => (
                <li key={kit.slug} className="rounded-2xl bg-white px-7 py-6 shadow-card">
                  <h3 className="mb-2 text-lg text-navy-deep">{kit.name}</h3>
                  <p className="text-[0.9375rem] text-muted">{kit.details?.kit?.idealFor}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {kits.length > 0 && (
          <section aria-labelledby="kits-title">
            <h2 id="kits-title" className="sr-only">
              {copy.kitsTitle}
            </h2>
            <KitCardGrid kits={kits} />
          </section>
        )}
      </Container>
    </>
  );
}
