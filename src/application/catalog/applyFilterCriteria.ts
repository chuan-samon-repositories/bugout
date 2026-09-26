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

const COMPARATORS: Record<SortOption, Comparator> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured),
  'price-asc': (a, b) => a.price.minor - b.price.minor,
  'price-desc': (a, b) => b.price.minor - a.price.minor,
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

/**
 * Filters and sorts a product list. Returns a new array; the input is not modified.
 * Sorting is stable, so ties keep the catalog order.
 */
export function applyFilterCriteria(products: readonly Product[], criteria: FilterCriteria): Product[] {
  const { min, max } = priceRange(criteria);
  const filtered = products.filter(
    (product) =>
      (!criteria.category || product.category === criteria.category) &&
      product.price.amount >= min &&
      product.price.amount <= max &&
      (!criteria.inStockOnly || product.inStock) &&
      (!criteria.onSaleOnly || product.isOnSale()),
  );
  return filtered.sort(COMPARATORS[criteria.sortBy] ?? COMPARATORS.featured);
}
