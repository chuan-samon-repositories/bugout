import type { Product } from "@/domain/entities/product/Product";
import { KitContentsList } from "@/presentation/components/catalog/ProductDetailSections";
import { ProductImage } from "@/presentation/components/catalog/ProductImage";
import { ButtonLink, Container, PriceTag } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

/** "What's inside" for the flagship kit, built from its catalog contents. */
export function KitShowcase({ product }: { product: Product }) {
  const t = messages.catalog.home;
  return (
    <section aria-labelledby="kit-title" className="bg-sand/30 py-16 sm:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-white">
          <ProductImage product={product} sizes="(min-width: 1024px) 448px, 90vw" className="p-6" />
        </div>
        <div className="min-w-0">
          <h2 id="kit-title" className="text-3xl font-bold tracking-tight text-ink">
            {t.kitTitle}
          </h2>
          <p className="mt-3 text-muted">{t.kitDescription}</p>
          <div className="mt-6">
            <KitContentsList product={product} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <PriceTag price={product.price} originalPrice={product.originalPrice} size="lg" />
            <ButtonLink href={routes.product(product.slug)}>{t.kitLink}</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
