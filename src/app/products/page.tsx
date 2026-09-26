import type { Metadata } from "next";
import { cache, Suspense } from "react";
import { summarizeCategories } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { getContainer } from "@/infrastructure/config";
import { parseCatalogSearchParams, readCategoryParam } from "@/presentation/components/catalog/catalogSearchParams";
import { CatalogView } from "@/presentation/components/catalog/CatalogView";
import { toProductSnapshot } from "@/presentation/components/catalog/productSnapshot";
import { AlertCircleIcon, buttonClasses, Container, PageHeader, Spinner } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { catalogUrl, routes } from "@/presentation/routes";
import { categoryLabel } from "@/presentation/components/catalog/categoryLabel";

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

/**
 * Category and offer views get their own title and canonical URL; other filters share the catalog's.
 * A `category` that is not in the catalog is ignored (never echoed into the title) and the page is noindex.
 */
export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const categories = (await loadCategorySlugs()) ?? [];
  const { category, onSaleOnly } = parseCatalogSearchParams(params, { categories });
  const requested = readCategoryParam(params);
  if (requested && !category) {
    return {
      title: messages.catalog.list.metaTitle,
      description: messages.catalog.list.metaDescription,
      alternates: { canonical: routes.products },
      robots: { index: false },
    };
  }
  if (category) {
    return {
      title: categoryLabel(category),
      description: messages.catalog.list.metaDescription,
      alternates: { canonical: catalogUrl({ category }) },
    };
  }
  if (onSaleOnly) {
    return {
      title: messages.catalog.list.saleMetaTitle,
      description: messages.catalog.list.metaDescription,
      alternates: { canonical: catalogUrl({ onSale: "1" }) },
    };
  }
  return {
    title: messages.catalog.list.metaTitle,
    description: messages.catalog.list.metaDescription,
    alternates: { canonical: routes.products },
  };
}

const breadcrumbs = [{ label: messages.common.home, href: routes.home }, { label: messages.common.products }];

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
    <Container>
      <Suspense fallback={<CatalogFallback />}>
        <CatalogView products={products.map(toProductSnapshot)} initialCriteria={criteria} />
      </Suspense>
    </Container>
  );
}

function CatalogFallback() {
  return (
    <>
      <PageHeader title={messages.catalog.list.title} breadcrumbs={breadcrumbs} />
      <div className="flex justify-center py-16 text-navy">
        <Spinner size="lg" label={messages.catalog.list.loading} />
      </div>
    </>
  );
}

function CatalogUnavailable() {
  return (
    <Container className="pb-16">
      <PageHeader title={messages.catalog.list.title} breadcrumbs={breadcrumbs} />
      <div role="alert" className="flex flex-col items-start gap-4 rounded-xl border border-danger/30 bg-white p-6 sm:flex-row">
        <AlertCircleIcon className="size-6 shrink-0 text-danger" />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">{messages.catalog.list.unavailableTitle}</h2>
          <p className="mt-1 text-muted">{messages.errors.catalogUnavailable}</p>
          <a href={routes.products} className={buttonClasses({ variant: "secondary", size: "sm", className: "mt-4" })}>
            {messages.common.retry}
          </a>
        </div>
      </div>
    </Container>
  );
}
