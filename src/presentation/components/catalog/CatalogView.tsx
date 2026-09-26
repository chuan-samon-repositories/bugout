"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { applyFilterCriteria, priceBounds, summarizeCategories } from "@/application/catalog";
import type { FilterCriteria, SortOption } from "@/application/dtos/FilterCriteria";
import { Money } from "@/domain/value-objects/Money";
import { Button, ChevronDownIcon, PageHeader, SelectField, cn } from "@/presentation/components/ui";
import { useAnalytics } from "@/presentation/context/AnalyticsContext";
import { useDebouncedValue } from "@/presentation/hooks/useDebouncedValue";
import { formatMoney, formatNumber, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { CatalogFilters } from "./CatalogFilters";
import {
  clearFilters,
  countActiveFilters,
  parseCatalogSearchParams,
  parsePrice,
  serializeCatalogCriteria,
} from "./catalogSearchParams";
import { categoryLabel } from "./categoryLabel";
import { ProductGrid } from "./ProductGrid";
import { fromProductSnapshot, type ProductSnapshot } from "./productSnapshot";
import { availableSortOptions } from "./sortOptions";

export const PRICE_DEBOUNCE_MS = 400;
export const ANALYTICS_DEBOUNCE_MS = 800;
const CATALOG_IMAGE_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";

export interface CatalogViewProps {
  products: readonly ProductSnapshot[];
  initialCriteria: FilterCriteria;
}

const priceText = (value: number | undefined) => (value === undefined ? "" : String(value));
const queryOf = (criteria: FilterCriteria) => serializeCatalogCriteria(criteria).toString();

/** Catalog listing: filters are applied in memory, so controls never unmount while filtering. */
export function CatalogView({ products: snapshots, initialCriteria }: CatalogViewProps) {
  const t = messages.catalog;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const analytics = useAnalytics();
  const panelId = useId();

  const products = useMemo(() => snapshots.map(fromProductSnapshot), [snapshots]);
  const categories = useMemo(() => summarizeCategories(products), [products]);
  const categorySlugs = useMemo(() => categories.map((category) => category.slug), [categories]);
  const bounds = useMemo(() => priceBounds(products), [products]);

  const [criteria, setCriteria] = useState<FilterCriteria>(initialCriteria);
  const [minText, setMinText] = useState(priceText(initialCriteria.priceMin));
  const [maxText, setMaxText] = useState(priceText(initialCriteria.priceMax));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedMin = useDebouncedValue(minText, PRICE_DEBOUNCE_MS);
  const debouncedMax = useDebouncedValue(maxText, PRICE_DEBOUNCE_MS);

  useEffect(() => {
    const priceMin = parsePrice(debouncedMin);
    setCriteria((current) => (current.priceMin === priceMin ? current : { ...current, priceMin }));
  }, [debouncedMin]);

  useEffect(() => {
    const priceMax = parsePrice(debouncedMax);
    setCriteria((current) => (current.priceMax === priceMax ? current : { ...current, priceMax }));
  }, [debouncedMax]);

  const syncedQuery = useRef(queryOf(initialCriteria));
  const writtenQueries = useRef(new Set<string>());

  // Filtering happens in memory, so the URL is updated with the native History API: Next.js
  // (>= 14.1) keeps useSearchParams in sync without a server round-trip or a re-render of the page.
  useEffect(() => {
    const query = queryOf(criteria);
    if (query === syncedQuery.current) return;
    syncedQuery.current = query;
    writtenQueries.current.add(query);
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }, [criteria, pathname]);

  // Adopt URL changes we did not make ourselves (e.g. a header link to another category).
  // Our own writes come back through useSearchParams too, possibly after a newer write:
  // those are recognised via writtenQueries and ignored, so the two effects never loop.
  const urlQuery = searchParams?.toString() ?? "";
  useEffect(() => {
    // Unknown categories are ignored, as on the server, so query text never becomes the heading.
    const fromUrl = parseCatalogSearchParams(new URLSearchParams(urlQuery), { categories: categorySlugs });
    const canonical = queryOf(fromUrl);
    if (canonical === syncedQuery.current) {
      writtenQueries.current.clear();
      return;
    }
    if (writtenQueries.current.has(canonical)) return;
    syncedQuery.current = canonical;
    setCriteria(fromUrl);
    setMinText(priceText(fromUrl.priceMin));
    setMaxText(priceText(fromUrl.priceMax));
  }, [urlQuery, categorySlugs]);

  const results = useMemo(() => applyFilterCriteria(products, criteria), [products, criteria]);

  const trackedCriteria = useDebouncedValue(criteria, ANALYTICS_DEBOUNCE_MS);
  const trackedQuery = useRef(queryOf(initialCriteria));
  useEffect(() => {
    const query = queryOf(trackedCriteria);
    if (query === trackedQuery.current) return;
    trackedQuery.current = query;
    analytics.track({
      name: "products_filtered",
      properties: {
        category: trackedCriteria.category ?? null,
        price_min: trackedCriteria.priceMin ?? null,
        price_max: trackedCriteria.priceMax ?? null,
        in_stock_only: !!trackedCriteria.inStockOnly,
        on_sale_only: !!trackedCriteria.onSaleOnly,
        sort_by: trackedCriteria.sortBy,
        result_count: applyFilterCriteria(products, trackedCriteria).length,
      },
    });
  }, [trackedCriteria, analytics, products]);

  const update = useCallback((patch: Partial<FilterCriteria>) => {
    setCriteria((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setCriteria((current) => clearFilters(current));
    setMinText("");
    setMaxText("");
  }, []);

  const activeCount = countActiveFilters(criteria);
  const draftMin = parsePrice(minText);
  const draftMax = parsePrice(maxText);
  const showSwapHint = draftMin !== undefined && draftMax !== undefined && draftMin > draftMax;
  const currency = products[0]?.price.currency;
  const rangeHint =
    bounds && currency
      ? t.filters.priceRange(
          formatMoney(Money.fromMajor(bounds.min, currency)),
          formatMoney(Money.fromMajor(bounds.max, currency)),
        )
      : null;

  const title = criteria.category ? categoryLabel(criteria.category) : t.list.title;
  const breadcrumbs = criteria.category
    ? [
        { label: messages.common.home, href: routes.home },
        { label: messages.common.products, href: routes.products },
        { label: title },
      ]
    : [{ label: messages.common.home, href: routes.home }, { label: messages.common.products }];

  const sortOptions = availableSortOptions(products, criteria.sortBy).map((value) => ({
    value,
    label: t.filters.sortOptions[value],
  }));

  return (
    <>
      <PageHeader title={title} breadcrumbs={breadcrumbs} />
      <div className="flex flex-col gap-6 pb-16 lg:flex-row lg:items-start lg:gap-10">
        <aside aria-label={t.filters.title} className="min-w-0 lg:sticky lg:top-20 lg:w-64 lg:shrink-0">
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls={panelId}
            onClick={() => setFiltersOpen((open) => !open)}
            className={cn(
              "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border-2 border-navy bg-white px-4 font-semibold text-navy",
              "hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 lg:hidden",
            )}
          >
            <span className="flex min-w-0 flex-wrap items-center gap-x-2">
              {t.filters.toggle}
              {activeCount > 0 && (
                <span className="text-sm font-normal text-muted">({t.filters.activeCount(activeCount)})</span>
              )}
            </span>
            <ChevronDownIcon className={cn("size-5 shrink-0 transition-transform", filtersOpen && "rotate-180")} />
          </button>
          <h2 className="sr-only lg:not-sr-only lg:mb-4 lg:text-lg lg:font-semibold lg:text-ink">{t.filters.title}</h2>
          <div id={panelId} className={cn(filtersOpen ? "block" : "hidden", "mt-4 lg:mt-0 lg:block")}>
            <CatalogFilters
              criteria={criteria}
              categories={categories}
              totalCount={products.length}
              minText={minText}
              maxText={maxText}
              bounds={bounds}
              rangeHint={rangeHint}
              showSwapHint={showSwapHint}
              activeCount={activeCount}
              onCategoryChange={(category) => update({ category })}
              onMinTextChange={setMinText}
              onMaxTextChange={setMaxText}
              onInStockChange={(inStockOnly) => update({ inStockOnly: inStockOnly || undefined })}
              onSaleChange={(onSaleOnly) => update({ onSaleOnly: onSaleOnly || undefined })}
              onClear={reset}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p aria-live="polite" aria-atomic="true" className="text-sm font-medium text-muted">
              {t.list.resultCount(results.length, formatNumber(results.length))}
            </p>
            <SelectField
              name="sort"
              label={t.filters.sort}
              value={criteria.sortBy}
              onChange={(event) => update({ sortBy: event.target.value as SortOption })}
              options={sortOptions}
              className="sm:w-64"
            />
          </div>

          {results.length > 0 ? (
            <ProductGrid products={results} sizes={CATALOG_IMAGE_SIZES} />
          ) : (
            <div className="rounded-xl border border-sand bg-sand/20 px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-ink">{t.list.emptyTitle}</h2>
              <p className="mt-2 text-muted">{t.list.emptyDescription}</p>
              {activeCount > 0 && (
                <Button className="mt-6" onClick={reset}>
                  {t.filters.clear}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
