import type { Metadata } from "next";
import { Prose } from "@/presentation/components/content/Prose";
import { navData } from "@/presentation/components/layout/navigation";
import { loadCatalogOrEmpty } from "@/presentation/components/kits/loadCatalog";
import { ButtonLink, Container, PageHeader } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { pageMetadata } from "@/presentation/seo/pageMetadata";

const copy = messages.content.whyPrepare;

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: copy.metaTitle,
  description: copy.metaDescription,
  path: routes.whyPrepare,
});

export default async function WhyPreparePage() {
  const [first, second] = navData(await loadCatalogOrEmpty("the why-prepare page")).kits;

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
        breadcrumbs={[{ label: messages.common.home, href: routes.home }, { label: copy.title }]}
      />
      <Container className="pt-14 pb-24 sm:pt-16">
        <Prose className="mx-auto">
          {copy.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {"link" in section && (
                <p>
                  <a href={section.link.href} target="_blank" rel="noopener noreferrer">
                    {section.link.label}
                    <span className="sr-only"> ({messages.common.opensInNewTab})</span>
                  </a>
                </p>
              )}
            </section>
          ))}
        </Prose>
        {first && (
          <div className="mx-auto mt-10 flex max-w-[47.5rem] flex-wrap gap-3">
            <ButtonLink href={routes.product(first.slug)}>{first.label}</ButtonLink>
            {second && (
              <ButtonLink href={routes.product(second.slug)} variant="secondary">
                {second.label}
              </ButtonLink>
            )}
          </div>
        )}
      </Container>
    </>
  );
}
