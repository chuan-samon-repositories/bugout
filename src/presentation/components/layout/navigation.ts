import { kitsIn, looseProductsIn, summarizeCategories } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { categoryLabel } from "@/presentation/components/catalog/categoryLabel";
import { messages } from "@/presentation/i18n";
import { catalogParams, catalogUrl, routes } from "@/presentation/routes";

export interface NavLink {
  href: string;
  label: string;
}

/** A kit as the navigation shows it. Plain data, so it can be passed to Client Components. */
export interface NavKit {
  slug: string;
  label: string;
}

/** A top-level entry of the primary navigation, with the links of its dropdown (none for a plain link). */
export interface NavSection extends NavLink {
  children: NavLink[];
}

/** A catalog category as the navigation shows it. */
export interface NavCategory {
  slug: string;
  label: string;
}

/** What the header, mobile menu and footer need from the catalog, loaded once by the root layout. */
export interface NavData {
  kits: NavKit[];
  /** Slug of the kit the "Compra ahora" call to action opens; null without kits. */
  flagshipSlug: string | null;
  /** Category every kit belongs to (`kits`), which "Kits" filters the catalog by; null when they differ or there are none. */
  kitsCategory: string | null;
  /** Categories of the loose products, in catalog order, for the "Productos" dropdown. */
  categories: NavCategory[];
}

/** Navigation data when the catalog could not be loaded: only the fixed links remain. */
export const EMPTY_NAV_DATA: NavData = { kits: [], flagshipSlug: null, kitsCategory: null, categories: [] };

/** Kits listed in the header, mobile menu and footer; more would crowd the desktop header. */
export const MAX_NAV_KITS = 4;

const nav = messages.shell.nav;
const footer = messages.shell.footer;

/**
 * Kits in catalog order (capped at `max`) and the flagship kit: the ready-made kit with the
 * most contents, which is the most complete kit (the Kit 72h in the demo catalog).
 */
export function navData(products: readonly Product[], max = MAX_NAV_KITS): NavData {
  const kits = kitsIn(products);
  // A ready-made kit when there is one; a build-your-own kit's contents are only its backpack choices.
  const packed = kits.filter((kit) => !kit.isBuildYourOwn());
  const flagship = (packed.length > 0 ? packed : kits).reduce<Product | null>(
    (best, kit) =>
      best === null || (kit.details?.contents.length ?? 0) > (best.details?.contents.length ?? 0) ? kit : best,
    null,
  );
  const kitCategories = new Set(kits.map((kit) => kit.category));
  const kitsCategory = kitCategories.size === 1 ? [...kitCategories][0]! : null;
  return {
    kits: kits.slice(0, max).map((kit) => ({ slug: kit.slug, label: kit.name })),
    flagshipSlug: flagship?.slug ?? null,
    kitsCategory,
    categories: summarizeCategories(looseProductsIn(products))
      .filter((category) => category.slug !== kitsCategory)
      .map((category) => ({ slug: category.slug, label: categoryLabel(category.slug) })),
  };
}

const kitLinks = (kits: readonly NavKit[]): NavLink[] =>
  kits.map((kit) => ({ href: routes.product(kit.slug), label: kit.label }));

/**
 * Header and mobile menu: "Kits" (the kits category, with every kit in its dropdown),
 * "Productos" (the catalog, with a link per category filtering it) and "Prepárate".
 */
export function primarySections(data: Pick<NavData, "kits" | "kitsCategory" | "categories">): NavSection[] {
  return [
    {
      href: data.kitsCategory ? catalogUrl({ category: data.kitsCategory }) : routes.products,
      label: nav.kits,
      children: kitLinks(data.kits),
    },
    {
      href: routes.products,
      label: nav.products,
      children: data.categories.map((category) => ({ href: catalogUrl({ category: category.slug }), label: category.label })),
    },
    { href: routes.whyPrepare, label: nav.whyPrepare, children: [] },
  ];
}

/** Footer "Tienda" column. */
export function shopLinks(kits: readonly NavKit[]): NavLink[] {
  return [
    ...kitLinks(kits),
    { href: routes.products, label: footer.looseProducts },
    { href: routes.howToChoose, label: footer.howToChoose },
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
