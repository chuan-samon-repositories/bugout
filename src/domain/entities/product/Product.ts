import { ValidationError } from '@/domain/errors';
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
}

/** Rich, optional merchandising content shown on the product detail page. */
export interface ProductDetails {
  longDescription?: string;
  features: string[];
  specifications: ProductSpecification[];
  contents: ProductContentItem[];
}

export interface ProductProps {
  /** Identifier understood by the commerce backend (JSON id or Shopify variant GID). */
  id: ProductId;
  /** URL-safe handle used in routes (`/products/{slug}`). */
  slug: string;
  name: string;
  description: string;
  price: Money;
  /** Previous price when the product is discounted. */
  originalPrice: Money | null;
  /** Category slug, e.g. "survival-kits". */
  category: string;
  inStock: boolean;
  badge: string | null;
  featured: boolean;
  /** Null when the backend has no review data. */
  rating: ProductRating | null;
  images: ProductImage[];
  details: ProductDetails | null;
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

  private constructor(props: ProductProps) {
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
    return new Product({ ...props, images: [...props.images] });
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
