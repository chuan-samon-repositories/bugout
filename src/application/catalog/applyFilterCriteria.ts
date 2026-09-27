import { Product } from '@/domain/entities/product/Product';
import { FilterCriteria, SortOption } from '@/application/dtos/FilterCriteria';

type Comparator = (a: Product, b: Product) => number;

/** Descending by a nullable key, with nulls last. */
function descendingNullsLast(key: (product: Product) => number | null): Comparator {
  return (a, b) => {
    const left = key(a);
    const right = key(b);
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    return right - left;
  };
}

/** The price a card shows: the cheapest variant ("Desde …" for kits with several sizes). */
const fromPrice = (product: Product) => product.priceRange().min.minor;

const COMPARATORS: Record<SortOption, Comparator> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured),
  'price-asc': (a, b) => fromPrice(a) - fromPrice(b),
  'price-desc': (a, b) => fromPrice(b) - fromPrice(a),
  rating: descendingNullsLast((product) => product.rating?.average ?? null),
  reviews: descendingNullsLast((product) => product.rating?.count ?? null),
};

function isBound(value: number | undefined): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function priceRange(criteria: FilterCriteria): { min: number; max: number } {
  const min = isBound(criteria.priceMin) ? criteria.priceMin : Number.NEGATIVE_INFINITY;
  const max = isBound(criteria.priceMax) ? criteria.priceMax : Number.POSITIVE_INFINITY;
  return min > max ? { min: max, max: min } : { min, max };
}

/** True when any variant's price (major units) lies within the inclusive bounds. */
function hasPriceWithin(product: Product, min: number, max: number): boolean {
  return product.variants.some(({ price }) => price.amount >= min && price.amount <= max);
}

/**
 * Filters and sorts a product list. Returns a new array; the input is not modified.
 * A product matches a price range when any of its variants does; price sorts use the
 * cheapest variant (the "Desde" price). Sorting is stable, so ties keep the catalog order.
 */
export function applyFilterCriteria(products: readonly Product[], criteria: FilterCriteria): Product[] {
  const { min, max } = priceRange(criteria);
  const filtered = products.filter(
    (product) =>
      (!criteria.category || product.category === criteria.category) &&
      hasPriceWithin(product, min, max) &&
      (!criteria.inStockOnly || product.inStock) &&
      (!criteria.onSaleOnly || product.isOnSale()),
  );
  return filtered.sort(COMPARATORS[criteria.sortBy] ?? COMPARATORS.featured);
}
