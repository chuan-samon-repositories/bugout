import type { Metadata } from "next";
import { cache, Suspense } from "react";
import { includedInIndex, summarizeCategories } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { getContainer } from "@/infrastructure/config";
import { parseCatalogSearchParams, readCategoryParam } from "@/presentation/components/catalog/catalogSearchParams";
import { CatalogView } from "@/presentation/components/catalog/CatalogView";
import { toProductSnapshot } from "@/presentation/components/catalog/productSnapshot";
import { AlertCircleIcon, buttonClasses, Container, PageHeader, Spinner } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { catalogUrl, routes } from "@/presentation/routes";
import { categoryLabel } from "@/presentation/components/catalog/categoryLabel";
import { siteConfig } from "@/presentation/config/site";
import { JsonLd } from "@/presentation/seo/JsonLd";
import { pageMetadata } from "@/presentation/seo/pageMetadata";
import { breadcrumbJsonLd } from "@/presentation/seo/structuredData";

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The catalog, loaded once per request for both the metadata and the page (React cache). */
const loadProducts = cache(() => getContainer().getGetProductsUseCase().execute());

/** Category slugs of the catalog, or null when it could not be loaded. */
async function loadCategorySlugs(): Promise<string[] | null> {
  try {
    return summarizeCategories(await loadProducts()).map((category) => category.slug);
  } catch {
    return null;
  }
}

const list = messages.catalog.list;

/**
 * Category and offer views get their own title and canonical URL; other filters share the catalog's.
 * Category pages take their title and description from `messages.catalog.categoryPages`.
 * A `category` that is not in the catalog is ignored (never echoed into the title) and the page is noindex.
 */
export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const categories = (await loadCategorySlugs()) ?? [];
  const { category, onSaleOnly } = parseCatalogSearchParams(params, { categories });
  const requested = readCategoryParam(params);
  if (requested && !category) {
    return pageMetadata({ title: list.metaTitle, description: list.metaDescription, path: routes.products, noindex: true });
  }
  if (category) {
    const page = messages.catalog.categoryPages[category];
    return pageMetadata({
      title: page?.title ?? categoryLabel(category),
      description: page?.description ?? list.metaDescription,
      path: catalogUrl({ category }),
    });
  }
  if (onSaleOnly) {
    return pageMetadata({ title: list.saleMetaTitle, description: list.metaDescription, path: catalogUrl({ onSale: "1" }) });
  }
  return pageMetadata({ title: list.metaTitle, description: list.metaDescription, path: routes.products });
}

const breadcrumbs = [{ label: messages.common.home, href: routes.home }, { label: messages.common.products }];

/** The breadcrumbs CatalogView shows, as structured data: the catalog, or the catalog > a category. */
function catalogBreadcrumbJsonLd(category: string | undefined) {
  if (!category) return breadcrumbJsonLd(breadcrumbs, routes.products, siteConfig.url);
  return breadcrumbJsonLd(
    [
      { label: messages.common.home, href: routes.home },
      { label: messages.common.products, href: routes.products },
      { label: categoryLabel(category) },
    ],
    catalogUrl({ category }),
    siteConfig.url,
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  let products: Product[];
  try {
    products = await loadProducts();
  } catch (error) {
    console.error("Could not load the catalog", error);
    return <CatalogUnavailable />;
  }
  const categories = summarizeCategories(products).map((category) => category.slug);
  const criteria = parseCatalogSearchParams(params, { categories });

  return (
    <>
      <JsonLd data={catalogBreadcrumbJsonLd(criteria.category)} />
      <Suspense fallback={<CatalogFallback />}>
        <CatalogView
          products={products.map(toProductSnapshot)}
          initialCriteria={criteria}
          includedIn={includedInIndex(products)}
        />
      </Suspense>
    </>
  );
}

function CatalogFallback() {
  return (
    <>
      <PageHeader title={list.title} description={list.description} breadcrumbs={breadcrumbs} placeholder />
      <div className="flex justify-center py-16 text-navy">
        <Spinner size="lg" label={messages.catalog.list.loading} />
      </div>
    </>
  );
}

function CatalogUnavailable() {
  return (
    <>
      <PageHeader title={list.title} breadcrumbs={breadcrumbs} />
      <Container className="py-14">
        <div role="alert" className="flex flex-col items-start gap-4 rounded-2xl border border-danger/30 bg-white p-6 sm:flex-row">
          <AlertCircleIcon className="size-6 shrink-0 text-danger" />
          <div className="min-w-0">
            <h2 className="text-lg text-navy-deep">{messages.catalog.list.unavailableTitle}</h2>
            <p className="mt-1 text-muted">{messages.errors.catalogUnavailable}</p>
            <a href={routes.products} className={buttonClasses({ variant: "secondary", size: "sm", className: "mt-4" })}>
              {messages.common.retry}
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
