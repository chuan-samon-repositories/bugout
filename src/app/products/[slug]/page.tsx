import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Product } from "@/domain/entities/product/Product";
import { NotFoundError } from "@/domain/errors";
import { getContainer } from "@/infrastructure/config";
import { AddToCart } from "@/presentation/components/catalog/AddToCart";
import { categoryLabel } from "@/presentation/components/catalog/categoryLabel";
import { DeliveryInfo } from "@/presentation/components/catalog/DeliveryInfo";
import { ProductDetailSections } from "@/presentation/components/catalog/ProductDetailSections";
import { ProductGallery } from "@/presentation/components/catalog/ProductGallery";
import { ProductGrid } from "@/presentation/components/catalog/ProductGrid";
import { ProductImage } from "@/presentation/components/catalog/ProductImage";
import { productViewedProperties } from "@/presentation/components/catalog/productAnalytics";
import { productJsonLd, serializeJsonLd } from "@/presentation/components/catalog/productJsonLd";
import { toProductSnapshot } from "@/presentation/components/catalog/productSnapshot";
import { ProductViewTracker } from "@/presentation/components/catalog/ProductViewTracker";
import {
  AlertCircleIcon,
  Breadcrumbs,
  CheckCircleIcon,
  Container,
  PriceTag,
  ProductBadge,
  RatingStars,
} from "@/presentation/components/ui";
import { siteConfig } from "@/presentation/config/site";
import { formatMoney, messages } from "@/presentation/i18n";
import { catalogUrl, routes } from "@/presentation/routes";

/** Product pages are prerendered and regenerated at most every 5 minutes (price and stock changes). */
export const revalidate = 300;
/** Products added after the build are rendered on first request. */
export const dynamicParams = true;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const MAX_RELATED = 3;

const getProduct = cache(async (slug: string): Promise<Product> => {
  try {
    return await getContainer().getGetProductBySlugUseCase().execute(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
});

async function getRelatedProducts(product: Product): Promise<Product[]> {
  try {
    const products = await getContainer().getGetProductsUseCase().execute();
    return products
      .filter((candidate) => candidate.category === product.category && candidate.slug !== product.slug)
      .slice(0, MAX_RELATED);
  } catch (error) {
    console.error("Could not load related products", error);
    return [];
  }
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const products = await getContainer().getGetProductsUseCase().execute();
    return products.map((product) => ({ slug: product.slug }));
  } catch (error) {
    console.error("Could not prerender product pages", error);
    return [];
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: routes.product(product.slug) },
    openGraph: {
      title: product.name,
      description: product.description,
      url: routes.product(product.slug),
      images: product.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        ...(image.width && image.height ? { width: image.width, height: image.height } : {}),
      })),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const related = await getRelatedProducts(product);
  const policy = getContainer().getPricingPolicy();
  const snapshot = toProductSnapshot(product);
  const t = messages.catalog.product;
  const savings = product.savings();
  const category = categoryLabel(product.category);

  return (
    <Container className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd(product, siteConfig.url)) }}
      />
      <ProductViewTracker properties={productViewedProperties(product)} />

      <Breadcrumbs
        className="py-6"
        items={[
          { label: messages.common.home, href: routes.home },
          { label: messages.common.products, href: routes.products },
          { label: category, href: catalogUrl({ category: product.category }) },
          { label: product.name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {product.images.length > 1 ? (
          <ProductGallery product={snapshot} />
        ) : (
          <div className="relative aspect-square min-w-0 overflow-hidden rounded-xl bg-sand/20">
            <ProductImage product={product} sizes="(min-width: 1024px) 50vw, 100vw" priority className="p-6" />
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-5">
          {product.badge && <ProductBadge badge={product.badge} className="self-start" />}
          <h1 className="break-words text-3xl font-bold tracking-tight text-ink sm:text-4xl">{product.name}</h1>
          <RatingStars rating={product.rating} showCount />

          <div className="flex flex-col gap-1">
            <PriceTag price={product.price} originalPrice={product.originalPrice} size="lg" />
            {savings && <p className="text-sm font-semibold text-success">{t.savings(formatMoney(savings))}</p>}
          </div>

          {product.inStock ? (
            <p className="flex items-center gap-2 font-medium text-success">
              <CheckCircleIcon className="size-5 shrink-0" />
              {t.inStock}
            </p>
          ) : (
            <p className="flex items-center gap-2 font-medium text-danger">
              <AlertCircleIcon className="size-5 shrink-0" />
              {t.outOfStock}
            </p>
          )}

          <p className="text-lg leading-relaxed text-muted">{product.description}</p>

          <AddToCart product={snapshot} />
          <DeliveryInfo policy={policy} />
        </div>
      </div>

      <div className="mt-16 border-t border-sand pt-12">
        <ProductDetailSections product={product} />
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-products-title" className="mt-16 border-t border-sand pt-12">
          <h2 id="related-products-title" className="mb-6 text-2xl font-bold text-ink">
            {t.related}
          </h2>
          <ProductGrid products={related} headingLevel={3} />
        </section>
      )}
    </Container>
  );
}
