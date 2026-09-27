import { isPeopleOption } from '@/application/catalog/variants';
import {
  Product,
  type KitInfo,
  type ProductContentItem,
  type ProductDetails,
  type ProductRating,
  type ProductSeo,
  type ProductSpecification,
  type ProductVariant,
} from '@/domain/entities/product/Product';
import { Money } from '@/domain/value-objects/Money';
import { ProductId } from '@/domain/value-objects/ProductId';

export const PRODUCT_FIELDS_FRAGMENT = /* GraphQL */ `
  fragment ProductFields on Product {
    handle
    title
    description
    seo { title description }
    productType
    tags
    images(first: 10) {
      nodes {
        url
        altText
        width
        height
      }
    }
    badge: metafield(namespace: "custom", key: "badge") { value }
    rating: metafield(namespace: "reviews", key: "rating") { value }
    ratingCount: metafield(namespace: "reviews", key: "rating_count") { value }
    features: metafield(namespace: "custom", key: "features") { value }
    specifications: metafield(namespace: "custom", key: "specifications") { value }
    contents: metafield(namespace: "custom", key: "contents") { value }
    kit: metafield(namespace: "custom", key: "kit") { value }
    related: metafield(namespace: "custom", key: "related") { value }
    longDescription: metafield(namespace: "custom", key: "long_description") { value }
    position: metafield(namespace: "custom", key: "position") { value }
  }
`;

export const VARIANT_FIELDS_FRAGMENT = /* GraphQL */ `
  fragment VariantFields on ProductVariant {
    id
    title
    availableForSale
    selectedOptions { name value }
    price { amount currencyCode }
    compareAtPrice { amount currencyCode }
  }
`;

interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

type ShopifyMetafield = { value: string } | null;

export interface ShopifyVariantNode {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
}

export interface ShopifyProductNode {
  handle: string;
  title: string;
  description: string;
  /** The "search engine listing" set in the Shopify admin; fields are null when not set. */
  seo: { title: string | null; description: string | null } | null;
  productType: string;
  tags: string[];
  images: { nodes: Array<{ url: string; altText: string | null; width: number | null; height: number | null }> };
  badge: ShopifyMetafield;
  rating: ShopifyMetafield;
  ratingCount: ShopifyMetafield;
  features: ShopifyMetafield;
  specifications: ShopifyMetafield;
  contents: ShopifyMetafield;
  kit: ShopifyMetafield;
  related: ShopifyMetafield;
  longDescription: ShopifyMetafield;
  position: ShopifyMetafield;
}

/** Product node as returned with `variants(first: 20) { nodes { ...VariantFields } }`. */
export interface ShopifyProductWithVariants extends ShopifyProductNode {
  variants: { nodes: ShopifyVariantNode[] };
}

function parseJson(value: string | undefined): unknown {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Lower-case kebab-case without accents; '' becomes 'general'. */
export function slugifyCategory(productType: string): string {
  const slug = productType
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'general';
}

/** Reads the `reviews.rating` metafield ({"value":"4.5","scale_min":"1.0","scale_max":"5.0"}) on a 0–5 scale. */
function parseRating(rating: ShopifyMetafield, ratingCount: ShopifyMetafield): ProductRating | null {
  const data = parseJson(rating?.value);
  if (!isRecord(data)) return null;
  const value = Number(data.value);
  const scaleMax = data.scale_max === undefined ? 5 : Number(data.scale_max);
  if (!Number.isFinite(value) || !Number.isFinite(scaleMax) || scaleMax <= 0) return null;
  const average = Math.round(Math.min(5, Math.max(0, (value / scaleMax) * 5)) * 100) / 100;
  const count = Number(ratingCount?.value);
  return { average, count: Number.isInteger(count) && count >= 0 ? count : 0 };
}

function parseList<T>(metafield: ShopifyMetafield, read: (item: unknown) => T | null): T[] | null {
  const data = parseJson(metafield?.value);
  if (!Array.isArray(data)) return null;
  return data.map(read).filter((item): item is T => item !== null);
}

const readFeature = (item: unknown) => (typeof item === 'string' ? item : null);

/** A JSON string, or a finite number as its string (`"quantity": 2` reads as "2"). */
function readText(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function readSpecification(item: unknown): ProductSpecification | null {
  if (!isRecord(item) || typeof item.label !== 'string') return null;
  const value = readText(item.value);
  return value === null ? null : { label: item.label, value };
}

/** A `custom.contents` line; `handle` links it to the catalog product it is. */
function readContent(item: unknown): ProductContentItem | null {
  if (!isRecord(item) || typeof item.item !== 'string') return null;
  const quantity = readText(item.quantity);
  if (quantity === null) return null;
  return {
    item: item.item,
    quantity,
    ...(typeof item.handle === 'string' && item.handle.trim() ? { productSlug: item.handle.trim() } : {}),
  };
}

/** Reads `custom.kit`: {"label":"72H","idealFor":"…","buildYourOwn":false}. */
function parseKit(metafield: ShopifyMetafield): KitInfo | null {
  const data = parseJson(metafield?.value);
  if (!isRecord(data) || typeof data.label !== 'string' || !data.label.trim()) return null;
  return {
    label: data.label.trim(),
    ...(typeof data.idealFor === 'string' && data.idealFor.trim() ? { idealFor: data.idealFor.trim() } : {}),
    ...(data.buildYourOwn === true ? { buildYourOwn: true } : {}),
  };
}

/**
 * The `custom.position` metafield (integer): where the product goes in the catalog,
 * lowest first. Null when unset or not an integer.
 */
export function parsePosition(node: Pick<ShopifyProductNode, 'position'>): number | null {
  const raw = node.position?.value.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

function parseDetails(node: ShopifyProductNode): ProductDetails | null {
  const longDescription = node.longDescription?.value.trim() || undefined;
  const features = parseList(node.features, readFeature);
  const specifications = parseList(node.specifications, readSpecification);
  const contents = parseList(node.contents, readContent);
  const kit = parseKit(node.kit);
  const related = parseList(node.related, readFeature);
  if (!longDescription && !features && !specifications && !contents && !kit && !related) return null;
  return {
    ...(longDescription ? { longDescription } : {}),
    features: features ?? [],
    specifications: specifications ?? [],
    contents: contents ?? [],
    ...(kit ? { kit } : {}),
    ...(related ? { related } : {}),
  };
}

/** The product's search engine listing, or null when neither field is set. */
function parseSeo(node: ShopifyProductNode): ProductSeo | null {
  const title = node.seo?.title?.trim();
  const description = node.seo?.description?.trim();
  if (!title && !description) return null;
  return { ...(title ? { title } : {}), ...(description ? { description } : {}) };
}

const isDefaultOption = ({ name, value }: { name: string; value: string }) =>
  name === 'Title' && value === 'Default Title';

/**
 * The variant's display title. Shopify builds `title` from the option values ("2", or
 * "2 / Rojo" with several options), so a bare number in a "Personas" option becomes
 * "2 personas" ("1 persona"), as in the local catalog. Any other title (including values
 * that already read "2 personas") is kept as Shopify sends it.
 */
function variantTitle(variant: ShopifyVariantNode, options: ReadonlyArray<{ name: string; value: string }>): string {
  if (options.length === 0) return '';
  const people = options.find(isPeopleOption);
  if (!people || !/^\d+$/.test(people.value.trim())) return variant.title;
  const count = Number(people.value.trim());
  if (!Number.isSafeInteger(count) || count <= 0) return variant.title;
  const peopleTitle = count === 1 ? '1 persona' : `${count} personas`;
  return options.map((option) => (option === people ? peopleTitle : option.value)).join(' / ');
}

function mapVariant(variant: ShopifyVariantNode): ProductVariant {
  const options = variant.selectedOptions.filter((option) => !isDefaultOption(option));
  return {
    id: new ProductId(variant.id),
    title: variantTitle(variant, options),
    options: options.map(({ name, value }) => ({ name, value })),
    price: Money.fromMajor(variant.price.amount, variant.price.currencyCode),
    originalPrice: variant.compareAtPrice
      ? Money.fromMajor(variant.compareAtPrice.amount, variant.compareAtPrice.currencyCode)
      : null,
    inStock: variant.availableForSale,
  };
}

/**
 * Maps a Storefront product to a Product whose id is the GID of `selected`.
 * `variants` lists every variant for the variant picker; when omitted (cart
 * lines) the product knows only the selected one.
 */
export function mapShopifyProduct(
  node: ShopifyProductNode,
  selected: ShopifyVariantNode,
  variants: readonly ShopifyVariantNode[] = [selected],
): Product {
  const all = variants.some((variant) => variant.id === selected.id) ? variants : [selected, ...variants];
  return Product.fromVariants(
    {
      slug: node.handle,
      name: node.title,
      description: node.description,
      category: slugifyCategory(node.productType),
      badge: node.badge?.value.trim() || null,
      featured: node.tags.some((tag) => tag.toLowerCase() === 'featured'),
      rating: parseRating(node.rating, node.ratingCount),
      images: node.images.nodes.map((image) => ({
        url: image.url,
        alt: image.altText?.trim() || node.title,
        width: image.width ?? undefined,
        height: image.height ?? undefined,
      })),
      details: parseDetails(node),
      seo: parseSeo(node),
    },
    all.map(mapVariant),
    selected.id,
  );
}
