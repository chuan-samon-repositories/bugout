import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { includedInIndex, kitsContaining, relatedProducts, resolveContents } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { NotFoundError } from "@/domain/errors";
import { getContainer } from "@/infrastructure/config";
import { categoryLabel } from "@/presentation/components/catalog/categoryLabel";
import { DeliveryInfo } from "@/presentation/components/catalog/DeliveryInfo";
import { ProductDetailSections, hasDetailSections } from "@/presentation/components/catalog/ProductDetailSections";
import { ProductGallery } from "@/presentation/components/catalog/ProductGallery";
import { ProductGrid } from "@/presentation/components/catalog/ProductGrid";
import { ProductImage } from "@/presentation/components/catalog/ProductImage";
import { productViewedProperties } from "@/presentation/components/catalog/productAnalytics";
import { productJsonLd } from "@/presentation/components/catalog/productJsonLd";
import { toProductSnapshot } from "@/presentation/components/catalog/productSnapshot";
import { ProductViewTracker } from "@/presentation/components/catalog/ProductViewTracker";
import { KitContentsList } from "@/presentation/components/kits/KitContents";
import { KitGallery } from "@/presentation/components/kits/KitGallery";
import { PurchasePanel } from "@/presentation/components/kits/PurchasePanel";
import {
  ArrowRightIcon,
  Breadcrumbs,
  ButtonLink,
  Container,
  Eyebrow,
  ProductBadge,
  RatingStars,
  cn,
  focusRing,
  textLinkClasses,
} from "@/presentation/components/ui";
import { siteConfig } from "@/presentation/config/site";
import { messages } from "@/presentation/i18n";
import { catalogUrl, routes } from "@/presentation/routes";
import { JsonLd } from "@/presentation/seo/JsonLd";
import { pageMetadata, SHARE_IMAGE_SIZE } from "@/presentation/seo/pageMetadata";
import { breadcrumbJsonLd } from "@/presentation/seo/structuredData";

/** Product pages are prerendered and regenerated at most every 5 minutes (price and stock changes). */
export const revalidate = 300;
/** Products added after the build are rendered on first request. */
export const dynamicParams = true;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/** Fallback cross-sell size when a product lists no related products. */
const MAX_RELATED = 4;

const getProduct = cache(async (slug: string): Promise<Product> => {
  try {
    return await getContainer().getGetProductBySlugUseCase().execute(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
});

/** The whole catalog, to resolve kit contents, "included in" badges and cross-sells; empty on failure. */
async function loadCatalog(): Promise<Product[]> {
  try {
    return await getContainer().getGetProductsUseCase().execute();
  } catch (error) {
    console.error("Could not load the catalog for a product page", error);
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

/**
 * The search title and description (`product.seo`, e.g. Shopify's search engine listing) fall back to the name and
 * short description. Products without photos (the kits, for now) share a generated image instead.
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  const images =
    product.images.length > 0
      ? product.images.map((image) => ({
          url: image.url,
          alt: image.alt,
          ...(image.width && image.height ? { width: image.width, height: image.height } : {}),
        }))
      : [
          {
            url: routes.productShareImage(product.slug),
            alt: messages.shell.metadata.productShareImageAlt(product.name),
            ...SHARE_IMAGE_SIZE,
          },
        ];
  return pageMetadata({
    title: product.seo?.title ?? product.name,
    description: product.seo?.description ?? product.description,
    path: routes.product(product.slug),
    images,
  });
}

const sectionTitle = "mb-6 text-[clamp(1.5rem,3vw,2rem)] text-navy-deep";

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const catalog = await loadCatalog();
  const policy = getContainer().getPricingPolicy();
  const snapshot = toProductSnapshot(product);
  const t = messages.catalog.product;
  const k = messages.catalog.kit;
  const kit = product.details?.kit ?? null;
  const buildYourOwn = !!kit?.buildYourOwn;
  const lines = resolveContents(product, catalog);
  const containing = kitsContaining(product.slug, catalog);
  const crossSell = relatedProducts(product, catalog);
  const related =
    crossSell.length > 0
      ? crossSell
      : catalog.filter((candidate) => candidate.category === product.category && candidate.slug !== product.slug).slice(0, MAX_RELATED);
  const category = categoryLabel(product.category);
  const breadcrumbs = [
    { label: messages.common.home, href: routes.home },
    { label: messages.common.products, href: routes.products },
    { label: category, href: catalogUrl({ category: product.category }) },
    { label: product.name },
  ];

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(product, { origin: siteConfig.url, policy }),
          breadcrumbJsonLd(breadcrumbs, routes.product(product.slug), siteConfig.url),
        ]}
      />
      <ProductViewTracker properties={productViewedProperties(product)} />

      <Container className="pt-8 pb-24">
        <Breadcrumbs items={breadcrumbs} />

        <div className="mt-8 mb-20 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {kit ? (
            <KitGallery kit={product} lines={lines} />
          ) : product.images.length > 1 ? (
            <ProductGallery product={snapshot} />
          ) : (
            <div className="relative aspect-square min-w-0 overflow-hidden rounded-2xl bg-navy">
              <ProductImage product={product} sizes="(min-width: 1024px) 560px, 100vw" priority />
            </div>
          )}

          <div className="flex min-w-0 flex-col gap-5">
            <div>
              <Eyebrow className="mb-2.5">{kit ? kit.label : category}</Eyebrow>
              {product.badge && <ProductBadge badge={product.badge} className="mb-3" />}
              <h1 className="text-[clamp(1.75rem,3.6vw,2.5rem)] leading-tight break-words text-navy-deep">{product.name}</h1>
            </div>
            <RatingStars rating={product.rating} showCount />
            <p className="text-base leading-relaxed text-muted">{product.description}</p>
            {kit && product.details?.longDescription && (
              // pre-line: a Shopify long description can contain line breaks.
              <p className="leading-relaxed whitespace-pre-line text-muted">{product.details.longDescription}</p>
            )}
            {containing.length > 0 && (
              <ul aria-label={k.includedInLabel} className="flex flex-wrap gap-2">
                {containing.map((container) => (
                  <li key={container.slug}>
                    <Link
                      href={routes.product(container.slug)}
                      className={cn(
                        "inline-flex min-h-9 items-center rounded-full bg-accent-soft px-3.5 text-xs font-bold text-navy-deep hover:bg-orange/30",
                        focusRing,
                      )}
                    >
                      {k.includedIn(container.name)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Only kits show their specs here; other products list them in ProductDetailSections below. */}
            <PurchasePanel product={snapshot} fromLabel={buildYourOwn} showSpecs={!!kit} />

            {kit && !buildYourOwn && (
              <Link href={routes.howToChoose} className={cn(textLinkClasses, "self-start")}>
                {k.compareLink}
                <ArrowRightIcon className="size-4" />
              </Link>
            )}
            <DeliveryInfo policy={policy} />
          </div>
        </div>

        {buildYourOwn && (
          <section aria-labelledby="build-your-own-title" className="mb-20 rounded-2xl bg-sand-dim px-7 py-8 sm:px-9">
            <h2 id="build-your-own-title" className="mb-2.5 text-lg text-navy-deep">
              {k.buildYourOwnTitle}
            </h2>
            <p className="mb-5 max-w-3xl text-muted">{k.buildYourOwnText}</p>
            <ButtonLink href={routes.products} variant="secondary" size="sm">
              {k.buildYourOwnCta}
            </ButtonLink>
          </section>
        )}

        {kit && !buildYourOwn && lines.length > 0 && (
          <section aria-labelledby="kit-contents-title" className="mb-20">
            <h2 id="kit-contents-title" className={sectionTitle}>
              {k.contentsTitle}
            </h2>
            {product.hasVariants() && <p className="mb-4 text-sm text-muted">{k.contentsQuantityNote}</p>}
            <KitContentsList lines={lines} />
          </section>
        )}

        {!kit && hasDetailSections(product) && (
          <div className="mb-20">
            <ProductDetailSections product={product} />
          </div>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-products-title">
            <h2 id="related-products-title" className={sectionTitle}>
              {kit ? k.crossSellTitle : t.related}
            </h2>
            <ProductGrid products={related} includedIn={includedInIndex(catalog)} headingLevel={3} />
          </section>
        )}
      </Container>
    </>
  );
}
