import { NotFoundError, ValidationError } from '@/domain/errors';
import { Money, discountPercentage } from '@/domain/value-objects/Money';
import { ProductId } from '@/domain/value-objects/ProductId';

export interface ProductImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ProductRating {
  /** Average score between 0 and 5. */
  average: number;
  count: number;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductContentItem {
  item: string;
  quantity: string;
  /** Slug of the catalog product this line is, when it is sold separately too. */
  productSlug?: string;
}

/** Deck of "Tarjetas de acción" a kit carries: the essential subset or every main card. */
export type ActionCardDeck = 'essential' | 'complete';

export const ACTION_CARD_DECKS: readonly ActionCardDeck[] = ['essential', 'complete'];

export function isActionCardDeck(value: unknown): value is ActionCardDeck {
  return typeof value === 'string' && (ACTION_CARD_DECKS as readonly string[]).includes(value);
}

/** Marks a product as a kit (Kit 24h, Kit 72h, Kit Custom) and holds its kit-only copy. */
export interface KitInfo {
  /** Short label shown on kit cards and as the eyebrow, e.g. "24H". */
  label: string;
  /** Who the kit is for, shown on the "how to choose" page. */
  idealFor?: string;
  /** The kit is a base the customer completes with loose products (Kit Custom). */
  buildYourOwn?: boolean;
  /** The printed action-card deck the kit includes, if any (the Prepárate page lists its cards). */
  actionCards?: ActionCardDeck;
}

/** Search-engine title and description, when they differ from the product name and short description. */
export interface ProductSeo {
  title?: string;
  description?: string;
}

/** Rich, optional merchandising content shown on the product detail page. */
export interface ProductDetails {
  longDescription?: string;
  features: string[];
  specifications: ProductSpecification[];
  contents: ProductContentItem[];
  /** Set only for kits. */
  kit?: KitInfo;
  /** Slugs of products to cross-sell, in display order. */
  related?: string[];
}

export interface ProductVariantOption {
  name: string;
  value: string;
}

/** One sellable option of a product (for kits: the number of people). */
export interface ProductVariant {
  /** Identifier understood by the commerce backend (JSON id or Shopify variant GID). */
  id: ProductId;
  /** Human title, e.g. "2 personas". Empty for a product's only, implicit variant. */
  title: string;
  options: ProductVariantOption[];
  price: Money;
  originalPrice: Money | null;
  inStock: boolean;
}

export interface ProductProps {
  /**
   * Identifier of the selected variant, understood by the commerce backend
   * (JSON id or Shopify variant GID). `id`, `price`, `originalPrice` and
   * `inStock` always describe the selected variant.
   */
  id: ProductId;
  /** URL-safe handle used in routes (`/products/{slug}`). */
  slug: string;
  name: string;
  description: string;
  price: Money;
  /** Previous price when the product is discounted. */
  originalPrice: Money | null;
  /** Category slug, e.g. "kits" or "luz-y-energia". */
  category: string;
  inStock: boolean;
  badge: string | null;
  featured: boolean;
  /** Null when the backend has no review data. */
  rating: ProductRating | null;
  images: readonly ProductImage[];
  details: ProductDetails | null;
  /** Search-engine title and description (Shopify's "search engine listing"); null or omitted when not set. */
  seo?: ProductSeo | null;
  /**
   * Every variant, in display order. Omit for a single-variant product. The
   * entry whose id equals `id` is the selected one; the top-level price,
   * original price and stock win over that entry's values. A lone entry with a
   * different id is replaced by the top-level values.
   */
  variants?: readonly ProductVariant[];
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Product entity representing a sellable item in the catalog.
 * Enforces invariants on price, rating and slug at construction time.
 */
export class Product {
  readonly id: ProductId;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly price: Money;
  readonly originalPrice: Money | null;
  readonly category: string;
  readonly inStock: boolean;
  readonly badge: string | null;
  readonly featured: boolean;
  readonly rating: ProductRating | null;
  readonly images: readonly ProductImage[];
  readonly details: ProductDetails | null;
  readonly seo: ProductSeo | null;
  /** Every variant, in display order; always at least the selected one. */
  readonly variants: readonly ProductVariant[];

  private constructor(props: ProductProps & { variants: readonly ProductVariant[] }) {
    this.id = props.id;
    this.slug = props.slug;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.originalPrice = props.originalPrice;
    this.category = props.category;
    this.inStock = props.inStock;
    this.badge = props.badge;
    this.featured = props.featured;
    this.rating = props.rating;
    this.images = props.images;
    this.details = props.details;
    this.seo = props.seo ?? null;
    this.variants = props.variants;
  }

  static create(props: ProductProps): Product {
    if (props.name.trim().length === 0) {
      throw new ValidationError('Product name cannot be empty');
    }
    if (!SLUG_PATTERN.test(props.slug)) {
      throw new ValidationError(`Invalid product slug: ${props.slug}`);
    }
    if (props.price.isZero()) {
      throw new ValidationError('Price must be positive');
    }
    if (props.originalPrice && props.originalPrice.currency !== props.price.currency) {
      throw new ValidationError('Original price must use the same currency as price');
    }
    if (props.rating) {
      const { average, count } = props.rating;
      if (average < 0 || average > 5) {
        throw new ValidationError('Rating must be between 0 and 5');
      }
      if (!Number.isInteger(count) || count < 0) {
        throw new ValidationError('Reviews count must be a non-negative integer');
      }
    }
    return new Product({ ...props, images: [...props.images], variants: normalizeVariants(props) });
  }

  /**
   * Builds a product from its variants, selecting `selectedId` or, by default,
   * the first variant in stock (the first one when none is).
   */
  static fromVariants(
    base: Omit<ProductProps, 'id' | 'price' | 'originalPrice' | 'inStock' | 'variants'>,
    variants: readonly ProductVariant[],
    selectedId?: string,
  ): Product {
    if (variants.length === 0) {
      throw new ValidationError('A product needs at least one variant');
    }
    const selected = selectedId
      ? variants.find((variant) => variant.id.value === selectedId)
      : (variants.find((variant) => variant.inStock) ?? variants[0]);
    if (!selected) {
      throw new NotFoundError(`Variant ${selectedId} not found in product ${base.slug}`);
    }
    return Product.create({
      ...base,
      id: selected.id,
      price: selected.price,
      originalPrice: selected.originalPrice,
      inStock: selected.inStock,
      variants,
    });
  }

  /** The same product with another variant selected. */
  withVariant(variantId: string): Product {
    if (variantId === this.id.value) return this;
    return Product.fromVariants(this, this.variants, variantId);
  }

  /** The variant `id`, `price` and `inStock` describe. */
  selectedVariant(): ProductVariant {
    return this.variants.find((variant) => variant.id.equals(this.id)) ?? this.variants[0];
  }

  /** True when the customer has to pick between several variants. */
  hasVariants(): boolean {
    return this.variants.length > 1;
  }

  /**
   * Title of the selected variant (e.g. "2 personas"), or null when the variant
   * has no options (a product's only, implicit variant). Works even when only
   * the selected variant is known, as for Shopify cart lines.
   */
  get variantTitle(): string | null {
    const variant = this.selectedVariant();
    return variant.options.length > 0 && variant.title ? variant.title : null;
  }

  /** The product name plus the selected variant, e.g. "Kit 72h · 2 personas". */
  get displayName(): string {
    const title = this.variantTitle;
    return title ? `${this.name} · ${title}` : this.name;
  }

  /** Lowest and highest variant prices. */
  priceRange(): { min: Money; max: Money } {
    let min = this.variants[0].price;
    let max = min;
    for (const { price } of this.variants) {
      if (min.greaterThan(price)) min = price;
      if (price.greaterThan(max)) max = price;
    }
    return { min, max };
  }

  /** True when variants have different prices, so a card shows "Desde". */
  hasPriceRange(): boolean {
    const { min, max } = this.priceRange();
    return !min.equals(max);
  }

  isKit(): boolean {
    return this.details?.kit !== undefined;
  }

  /**
   * A build-your-own kit (the Kit Custom): not sold as such. Its page is a builder that adds
   * the base backpack and the loose products the visitor picks, each as its own cart line.
   */
  isBuildYourOwn(): boolean {
    return this.details?.kit?.buildYourOwn === true;
  }

  isOnSale(): boolean {
    return this.originalPrice !== null && this.originalPrice.greaterThan(this.price);
  }

  /** Amount saved versus the original price, or null when not on sale. */
  savings(): Money | null {
    return this.isOnSale() && this.originalPrice ? this.originalPrice.subtract(this.price) : null;
  }

  /** Whole-number discount versus the original price; 0 when not on sale. */
  discountPercentage(): number {
    return this.originalPrice ? discountPercentage(this.price, this.originalPrice) : 0;
  }

  isFeatured(): boolean {
    return this.featured;
  }

  hasReviews(): boolean {
    return this.rating !== null && this.rating.count > 0;
  }
}

function normalizeVariants(props: ProductProps): ProductVariant[] {
  const selected = (base?: ProductVariant): ProductVariant => ({
    id: props.id,
    title: base?.title ?? '',
    options: base ? base.options.map((option) => ({ ...option })) : [],
    price: props.price,
    originalPrice: props.originalPrice,
    inStock: props.inStock,
  });

  const given = props.variants ?? [];
  if (given.length === 0) return [selected()];

  const index = given.findIndex((variant) => variant.id.equals(props.id));
  if (index === -1) {
    if (given.length === 1) return [selected(given[0])];
    throw new ValidationError(`Selected variant ${props.id.value} is not one of the variants of ${props.slug}`);
  }

  const variants = given.map((variant, i) =>
    i === index ? selected(variant) : { ...variant, options: variant.options.map((option) => ({ ...option })) },
  );
  const ids = new Set<string>();
  for (const variant of variants) {
    if (ids.has(variant.id.value)) {
      throw new ValidationError(`Duplicate variant id ${variant.id.value} in ${props.slug}`);
    }
    ids.add(variant.id.value);
    if (variant.price.currency !== props.price.currency) {
      throw new ValidationError('All variants must use the same currency');
    }
    if (variant.price.isZero()) {
      throw new ValidationError('Variant price must be positive');
    }
    if (variant.originalPrice && variant.originalPrice.currency !== variant.price.currency) {
      throw new ValidationError('Original price must use the same currency as price');
    }
  }
  return variants;
}
