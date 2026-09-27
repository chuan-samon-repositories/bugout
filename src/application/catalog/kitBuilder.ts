import { MAX_QUANTITY_PER_ITEM } from '@/domain/entities/cart/Cart';
import type { Product } from '@/domain/entities/product/Product';
import { Money, type CurrencyCode } from '@/domain/value-objects/Money';
import { comparableKits, looseProductsIn, resolveContents } from '@/application/catalog/kits';

/**
 * The base backpacks a build-your-own kit starts from: the catalog products its content
 * lines link to (e.g. `mochila-30l` and `mochila-65l`), in the order the kit lists them.
 */
export function builderBases(kit: Product, products: readonly Product[]): Product[] {
  const bases: Product[] = [];
  for (const { product } of resolveContents(kit, products)) {
    if (product && !product.isKit() && !bases.some((base) => base.slug === product.slug)) bases.push(product);
  }
  return bases;
}

export interface BuilderGroup {
  category: string;
  products: Product[];
}

/** The loose products the builder offers (every one except the bases), grouped by category in catalog order. */
export function builderGroups(kit: Product, products: readonly Product[]): BuilderGroup[] {
  const bases = new Set(builderBases(kit, products).map((base) => base.slug));
  const groups = new Map<string, Product[]>();
  for (const product of looseProductsIn(products)) {
    if (bases.has(product.slug)) continue;
    const group = groups.get(product.category);
    if (group) group.push(product);
    else groups.set(product.category, [product]);
  }
  return Array.from(groups, ([category, grouped]) => ({ category, products: grouped }));
}

/** A ready-made kit as a builder selection ("Partir del Kit 72h"). Plain data, so it can reach a Client Component. */
export interface BuilderPreset {
  kitSlug: string;
  kitName: string;
  /** The base backpack the kit includes, or null when it includes none. */
  baseSlug: string | null;
  /** Units per product slug, for the loose products the builder offers. */
  quantities: Record<string, number>;
  /** Content lines the builder cannot add: not sold separately (water, food rations…) or sold out. */
  unavailable: string[];
}

/** A content line's quantity ("2") as whole units; anything that is not a positive number counts as 1. */
function lineUnits(quantity: string): number {
  const units = Number.parseInt(quantity, 10);
  return Number.isSafeInteger(units) && units > 0 ? Math.min(units, MAX_QUANTITY_PER_ITEM) : 1;
}

/**
 * One preset per comparable kit (Kit 24h, Kit 72h): its linked, in-stock contents as builder
 * quantities. Contents are listed for the kit's smallest (1-person) version. Kits whose
 * contents the builder cannot offer at all are left out.
 */
export function builderPresets(kit: Product, products: readonly Product[]): BuilderPreset[] {
  const bases = new Set(builderBases(kit, products).map((base) => base.slug));
  const offered = new Set(builderGroups(kit, products).flatMap((group) => group.products.map((product) => product.slug)));
  return comparableKits(products)
    .filter((source) => source.slug !== kit.slug)
    .map((source) => {
      const preset: BuilderPreset = { kitSlug: source.slug, kitName: source.name, baseSlug: null, quantities: {}, unavailable: [] };
      for (const line of resolveContents(source, products)) {
        const product = line.product;
        if (product?.inStock && bases.has(product.slug)) {
          preset.baseSlug ??= product.slug;
        } else if (product?.inStock && offered.has(product.slug)) {
          preset.quantities[product.slug] = Math.min(
            MAX_QUANTITY_PER_ITEM,
            (preset.quantities[product.slug] ?? 0) + lineUnits(line.quantity),
          );
        } else {
          preset.unavailable.push(line.item);
        }
      }
      return preset;
    })
    .filter((preset) => preset.baseSlug !== null || Object.keys(preset.quantities).length > 0);
}

export interface BuilderLine {
  product: Product;
  quantity: number;
}

/** What the selected lines cost together. */
export function builderTotal(lines: readonly BuilderLine[], currency: CurrencyCode): Money {
  return lines.reduce((total, line) => total.add(line.product.price.multiply(line.quantity)), Money.zero(currency));
}
