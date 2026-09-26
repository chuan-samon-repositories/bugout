import { SORT_OPTIONS, type FilterCriteria, type SortOption } from "@/application/dtos/FilterCriteria";
import { catalogParams } from "@/presentation/routes";

/** What Next.js passes as `searchParams`, or a URLSearchParams from `useSearchParams()`. */
export type SearchParamsInput =
  | URLSearchParams
  | { get(name: string): string | null }
  | Record<string, string | string[] | undefined>;

function read(input: SearchParamsInput, key: string): string | undefined {
  if (typeof (input as URLSearchParams).get === "function") {
    return (input as URLSearchParams).get(key) ?? undefined;
  }
  const value = (input as Record<string, string | string[] | undefined>)[key];
  return Array.isArray(value) ? value[0] : value;
}

function isSortOption(value: string | undefined): value is SortOption {
  return value !== undefined && (SORT_OPTIONS as readonly string[]).includes(value);
}

/** Parses a non-negative price in major units ("49", "49.5", "49,5"); anything else is undefined. */
export function parsePrice(value: string | undefined): number | undefined {
  const trimmed = value?.trim().replace(",", ".");
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return undefined;
  const amount = Number(trimmed);
  return Number.isFinite(amount) ? amount : undefined;
}

export interface ParseCatalogOptions {
  /**
   * Category slugs of the loaded catalog (summarizeCategories). When given, any other `category` value is
   * ignored, so arbitrary query text never becomes page content (title, heading, breadcrumbs).
   */
  categories?: readonly string[];
}

/** The raw `category` value, trimmed; undefined when absent or blank. */
export function readCategoryParam(input: SearchParamsInput): string | undefined {
  return read(input, catalogParams.category)?.trim() || undefined;
}

/** Catalog query string → FilterCriteria. Invalid values fall back to their defaults. */
export function parseCatalogSearchParams(input: SearchParamsInput, options: ParseCatalogOptions = {}): FilterCriteria {
  const category = readCategoryParam(input);
  const sort = read(input, catalogParams.sort);
  const criteria: FilterCriteria = { sortBy: isSortOption(sort) ? sort : "featured" };

  if (category && (!options.categories || options.categories.includes(category))) criteria.category = category;
  const priceMin = parsePrice(read(input, catalogParams.priceMin));
  if (priceMin !== undefined) criteria.priceMin = priceMin;
  const priceMax = parsePrice(read(input, catalogParams.priceMax));
  if (priceMax !== undefined) criteria.priceMax = priceMax;
  if (read(input, catalogParams.inStock) === "1") criteria.inStockOnly = true;
  if (read(input, catalogParams.onSale) === "1") criteria.onSaleOnly = true;
  return criteria;
}

/** FilterCriteria → query string, omitting defaults so an unfiltered catalog has a clean URL. */
export function serializeCatalogCriteria(criteria: FilterCriteria): URLSearchParams {
  const search = new URLSearchParams();
  if (criteria.category) search.set(catalogParams.category, criteria.category);
  if (criteria.sortBy && criteria.sortBy !== "featured") search.set(catalogParams.sort, criteria.sortBy);
  if (isPrice(criteria.priceMin)) search.set(catalogParams.priceMin, String(criteria.priceMin));
  if (isPrice(criteria.priceMax)) search.set(catalogParams.priceMax, String(criteria.priceMax));
  if (criteria.inStockOnly) search.set(catalogParams.inStock, "1");
  if (criteria.onSaleOnly) search.set(catalogParams.onSale, "1");
  return search;
}

function isPrice(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Number of active filters (sorting is not a filter; a price range counts once). */
export function countActiveFilters(criteria: FilterCriteria): number {
  return (
    (criteria.category ? 1 : 0) +
    (isPrice(criteria.priceMin) || isPrice(criteria.priceMax) ? 1 : 0) +
    (criteria.inStockOnly ? 1 : 0) +
    (criteria.onSaleOnly ? 1 : 0)
  );
}

/** Keeps the sort order and clears every filter. */
export function clearFilters(criteria: FilterCriteria): FilterCriteria {
  return { sortBy: criteria.sortBy };
}
