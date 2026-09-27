import Link from "next/link";
import type { Product } from "@/domain/entities/product/Product";
import { ProductGrid } from "@/presentation/components/catalog/ProductGrid";
import { ArrowRightIcon, Container, Reveal, SectionHeading, textLinkClasses } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

export interface FeaturedProductsProps {
  products: readonly Product[];
  includedIn: Readonly<Record<string, readonly string[]>>;
}

/** Section 6: loose products to complete or renew a kit. */
export function FeaturedProducts({ products, includedIn }: FeaturedProductsProps) {
  const t = messages.catalog.home;
  return (
    <section aria-labelledby="featured-title" className="py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading id="featured-title" eyebrow={t.shopEyebrow} title={t.shopTitle} description={t.shopDescription} />
        </Reveal>
        <ProductGrid products={products} includedIn={includedIn} headingLevel={3} />
        <p className="mt-8 text-center">
          <Link href={routes.products} className={textLinkClasses}>
            {t.viewCatalog}
            <ArrowRightIcon className="size-4" />
          </Link>
        </p>
      </Container>
    </section>
  );
}
