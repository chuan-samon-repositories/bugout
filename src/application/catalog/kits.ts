import type { Product, ProductContentItem } from '@/domain/entities/product/Product';
import type { Money } from '@/domain/value-objects/Money';

/** Category slug of kits, the same for the local catalog and Shopify ("Kits" product type). */
export const KIT_CATEGORY = 'kits';

/** Kits in catalog order. A product is a kit when its details carry kit info. */
export function kitsIn(products: readonly Product[]): Product[] {
  return products.filter((product) => product.isKit());
}

/** Everything that is not a kit (the loose products). */
export function looseProductsIn(products: readonly Product[]): Product[] {
  return products.filter((product) => !product.isKit());
}

/** Kits that can be compared line by line: every kit except build-your-own ones. */
export function comparableKits(products: readonly Product[]): Product[] {
  return kitsIn(products).filter((kit) => !kit.details?.kit?.buildYourOwn);
}

/** Kits whose contents include the product with this slug ("Incluido en el Kit 24h"). */
export function kitsContaining(slug: string, products: readonly Product[]): Product[] {
  return kitsIn(products).filter(
    (kit) => kit.slug !== slug && (kit.details?.contents ?? []).some((line) => line.productSlug === slug),
  );
}

/**
 * For every product some kit includes, the names of those kits, keyed by product slug.
 * Plain data, so a Server Component can hand it to a client listing.
 */
export function includedInIndex(products: readonly Product[]): Record<string, string[]> {
  const index: Record<string, string[]> = {};
  for (const kit of kitsIn(products)) {
    for (const { productSlug } of kit.details?.contents ?? []) {
      if (!productSlug || productSlug === kit.slug) continue;
      const names = (index[productSlug] ??= []);
      if (!names.includes(kit.name)) names.push(kit.name);
    }
  }
  return index;
}

export interface ResolvedContentLine extends ProductContentItem {
  /** The catalog product this line refers to, when there is one. */
  product: Product | null;
}

/** A kit's contents, each line joined with its catalog product when it references one. */
export function resolveContents(kit: Product, products: readonly Product[]): ResolvedContentLine[] {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  return (kit.details?.contents ?? []).map((line) => ({
    ...line,
    product: line.productSlug ? (bySlug.get(line.productSlug) ?? null) : null,
  }));
}

/** Cross-sell products in the order the product lists them; unknown slugs are skipped. */
export function relatedProducts(product: Product, products: readonly Product[]): Product[] {
  const bySlug = new Map(products.map((candidate) => [candidate.slug, candidate]));
  return (product.details?.related ?? [])
    .map((slug) => bySlug.get(slug))
    .filter((candidate): candidate is Product => candidate !== undefined && candidate.slug !== product.slug);
}

/** The product that owns this variant id, resolved to that variant; null when none does. */
export function findByVariantId(products: readonly Product[], variantId: string): Product | null {
  const owner = products.find((product) => product.variants.some((variant) => variant.id.value === variantId));
  return owner ? owner.withVariant(variantId) : null;
}

export type KitComparisonRow =
  | { kind: 'price'; values: Money[] }
  | { kind: 'variants'; label: string | null; values: string[][] }
  | { kind: 'spec'; label: string; values: (string | null)[] }
  | { kind: 'items'; values: number[] };

/**
 * Side-by-side rows for a kit comparison table: starting price, variant
 * choices (e.g. number of people), every specification any kit has (in
 * first-seen order) and the number of content lines.
 */
export function compareKits(kits: readonly Product[]): KitComparisonRow[] {
  if (kits.length === 0) return [];
  const rows: KitComparisonRow[] = [{ kind: 'price', values: kits.map((kit) => kit.priceRange().min) }];

  if (kits.some((kit) => kit.hasVariants())) {
    const optionName = kits.flatMap((kit) => kit.variants.flatMap((variant) => variant.options))[0]?.name ?? null;
    rows.push({
      kind: 'variants',
      label: optionName,
      values: kits.map((kit) =>
        kit.hasVariants()
          ? kit.variants.map((variant) => variant.options[0]?.value ?? variant.title)
          : [],
      ),
    });
  }

  const labels: string[] = [];
  for (const kit of kits) {
    for (const { label } of kit.details?.specifications ?? []) {
      if (!labels.includes(label)) labels.push(label);
    }
  }
  for (const label of labels) {
    rows.push({
      kind: 'spec',
      label,
      values: kits.map((kit) => kit.details?.specifications.find((spec) => spec.label === label)?.value ?? null),
    });
  }

  rows.push({ kind: 'items', values: kits.map((kit) => kit.details?.contents.length ?? 0) });
  return rows;
}
