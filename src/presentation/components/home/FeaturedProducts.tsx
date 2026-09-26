import Link from "next/link";
import type { Product } from "@/domain/entities/product/Product";
import { ProductGrid } from "@/presentation/components/catalog/ProductGrid";
import { ChevronRightIcon, Container, cn, focusRing } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

export function FeaturedProducts({ products }: { products: readonly Product[] }) {
  const t = messages.catalog.home;
  return (
    <section aria-labelledby="featured-title" className="py-16 sm:py-20">
      <Container>
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 id="featured-title" className="text-3xl font-bold tracking-tight text-ink">
              {t.featuredTitle}
            </h2>
            <p className="mt-2 text-muted">{t.featuredDescription}</p>
          </div>
          <Link
            href={routes.products}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-sm font-semibold text-accent hover:text-accent-hover hover:underline underline-offset-4",
              focusRing,
            )}
          >
            {t.viewCatalog}
            <ChevronRightIcon className="size-4" />
          </Link>
        </div>
        <ProductGrid products={products} headingLevel={3} />
      </Container>
    </section>
  );
}
