import { summarizeCategories } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { categoryLabel } from "@/presentation/components/catalog/categoryLabel";
import { messages } from "@/presentation/i18n";
import { catalogParams, catalogUrl, routes } from "@/presentation/routes";

export interface NavLink {
  href: string;
  label: string;
}

/** A catalog category as the navigation shows it. Plain data, so it can be passed to Client Components. */
export interface NavCategory {
  slug: string;
  label: string;
}

/** Categories listed in the header, mobile menu and footer; more would crowd the desktop header. */
export const MAX_NAV_CATEGORIES = 4;

const nav = messages.shell.nav;

/** The catalog's categories in first-seen order, labelled in Spanish and capped at `max`. */
export function navCategories(products: readonly Product[], max = MAX_NAV_CATEGORIES): NavCategory[] {
  return summarizeCategories(products)
    .slice(0, max)
    .map(({ slug }) => ({ slug, label: categoryLabel(slug) }));
}

/** "Todos los productos", one link per category, then "Ofertas". */
export function shopLinks(categories: readonly NavCategory[]): NavLink[] {
  return [
    { href: routes.products, label: nav.allProducts },
    ...categories.map((category) => ({ href: catalogUrl({ category: category.slug }), label: category.label })),
    { href: catalogUrl({ onSale: "1" }), label: nav.offers },
  ];
}

/** Shop links followed by the company pages. */
export function primaryLinks(categories: readonly NavCategory[]): NavLink[] {
  return [
    ...shopLinks(categories),
    { href: routes.about, label: nav.about },
    { href: routes.contact, label: nav.contact },
  ];
}

/** Catalog query keys that select a distinct navigation destination (sorting and price filters do not). */
const NAV_SCOPED_PARAMS = [catalogParams.category, catalogParams.onSale];

/**
 * Whether `href` is the page being shown. Catalog links also compare the category
 * and sale filters; `search` is null while search params are not yet known.
 */
export function isCurrentLink(href: string, pathname: string, search: Pick<URLSearchParams, "get"> | null): boolean {
  const target = new URL(href, "http://localhost");
  if (target.pathname !== pathname) return false;
  if (target.pathname !== routes.products) return true;
  if (!search) return false;
  return NAV_SCOPED_PARAMS.every((key) => target.searchParams.get(key) === search.get(key));
}
