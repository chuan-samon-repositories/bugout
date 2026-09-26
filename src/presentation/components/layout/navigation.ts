import { messages } from "@/presentation/i18n";
import { catalogParams, catalogUrl, routes } from "@/presentation/routes";

export interface NavLink {
  href: string;
  label: string;
}

const nav = messages.shell.nav;

export const shopLinks: NavLink[] = [
  { href: routes.products, label: nav.allProducts },
  { href: catalogUrl({ category: "survival-kits" }), label: nav.survivalKits },
  { href: catalogUrl({ category: "accessories" }), label: nav.accessories },
  { href: catalogUrl({ onSale: "1" }), label: nav.offers },
];

export const primaryLinks: NavLink[] = [
  ...shopLinks,
  { href: routes.about, label: nav.about },
  { href: routes.contact, label: nav.contact },
];

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
