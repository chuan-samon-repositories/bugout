import type { Metadata } from "next";
import Link from "next/link";
import { comparableKits, kitsIn } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { getContainer } from "@/infrastructure/config";
import { ContactFaq, FaqItem, faqLinkClasses } from "@/presentation/components/forms/ContactFaq";
import { loadCatalogOrEmpty } from "@/presentation/components/kits/loadCatalog";
import { Container, PageHeader } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.content.faqPage;
const kitCopy = messages.catalog.kit;

export const revalidate = 300;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
  alternates: { canonical: routes.faq },
};

/** "1, 2 o 4" across every kit sold in several sizes, in first-seen order. */
function peopleOptions(kits: readonly Product[]): string | null {
  const values: string[] = [];
  for (const kit of kits) {
    if (!kit.hasVariants()) continue;
    for (const variant of kit.variants) {
      const value = variant.options[0]?.value;
      if (value && !values.includes(value)) values.push(value);
    }
  }
  return values.length > 0 ? kitCopy.peopleList(values) : null;
}

/** "El Kit 24h y el Kit 72h" */
const kitNames = (kits: readonly Product[]) => {
  const names = kits.map((kit) => `el ${kit.name}`);
  const joined = names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
  return joined.charAt(0).toUpperCase() + joined.slice(1);
};

/** Kit questions answered from the catalog, then the order questions shared with the contact page. */
export default async function FaqPage() {
  const products = await loadCatalogOrEmpty("the FAQ page");
  const kits = kitsIn(products);
  const compared = comparableKits(products);
  const sized = kits.filter((kit) => kit.hasVariants());
  const people = peopleOptions(sized);
  const custom = kits.find((kit) => kit.details?.kit?.buildYourOwn);

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
        breadcrumbs={[{ label: messages.common.home, href: routes.home }, { label: copy.title }]}
      />
      <Container className="flex max-w-[55rem] flex-col gap-16 py-16 sm:py-20">
        {kits.length > 0 && (
          <section aria-labelledby="faq-kits-title">
            <h2 id="faq-kits-title" className="text-2xl text-navy-deep">
              {copy.kitsTitle}
            </h2>
            <div className="mt-6 space-y-3">
              {compared.length > 1 && (
                <FaqItem question={copy.differenceQuestion}>
                  <ul className="list-disc space-y-1 pl-5">
                    {compared.map((kit) => (
                      <li key={kit.slug}>
                        <strong className="text-navy-deep">{kit.name}:</strong> {kit.description}
                      </li>
                    ))}
                  </ul>
                  <p>
                    <Link href={routes.howToChoose} className={faqLinkClasses}>
                      {copy.differenceLink}
                    </Link>
                  </p>
                </FaqItem>
              )}
              {people && (
                <FaqItem question={copy.peopleQuestion}>
                  <p>{copy.peopleAnswer(kitNames(sized), people)}</p>
                </FaqItem>
              )}
              {custom && (
                <FaqItem question={copy.customQuestion}>
                  <p>
                    {copy.customAnswer(custom.name)}{" "}
                    <Link href={routes.product(custom.slug)} className={faqLinkClasses}>
                      {copy.customLink(custom.name)}
                    </Link>
                  </p>
                </FaqItem>
              )}
              <FaqItem question={copy.looseQuestion}>
                <p>
                  {copy.looseAnswer}{" "}
                  <Link href={routes.products} className={faqLinkClasses}>
                    {copy.looseLink}
                  </Link>
                </p>
              </FaqItem>
              <FaqItem question={copy.expiryQuestion}>
                <p>{copy.expiryAnswer}</p>
              </FaqItem>
            </div>
          </section>
        )}
        <ContactFaq policy={getContainer().getPricingPolicy()} title={copy.ordersTitle} />
      </Container>
    </>
  );
}
