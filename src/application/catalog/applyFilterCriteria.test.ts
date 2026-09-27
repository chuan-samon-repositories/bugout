import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { applyFilterCriteria } from './applyFilterCriteria';
import { FilterCriteria, SORT_OPTIONS } from '@/application/dtos/FilterCriteria';
import { buildProduct } from '@/domain/testing/buildProduct';
import { Product } from '@/domain/entities/product/Product';

const ids = (products: Product[]) => products.map((product) => product.id.value);

const catalog = [
  buildProduct({ id: 'kit-24h', category: 'survival-kits', price: 199, originalPrice: 249, featured: true, rating: { average: 4.9, count: 1247 } }),
  buildProduct({ id: 'kit-72h', category: 'survival-kits', price: 299, originalPrice: 399, featured: true, rating: { average: 5, count: 2156 } }),
  buildProduct({ id: 'custom', category: 'survival-kits', price: 149, originalPrice: 199, rating: null }),
  buildProduct({ id: 'food', category: 'accessories', price: 49, rating: { average: 4.8, count: 432 } }),
  buildProduct({ id: 'water', category: 'accessories', price: 39, inStock: false, rating: { average: 4.6, count: 328 } }),
];

const all: FilterCriteria = { sortBy: 'featured' };

describe('applyFilterCriteria', () => {
  it('returns everything, featured first and otherwise in catalog order', () => {
    const shuffled = [catalog[2], catalog[0], catalog[3], catalog[1], catalog[4]];
    expect(ids(applyFilterCriteria(shuffled, all))).toEqual(['kit-24h', 'kit-72h', 'custom', 'food', 'water']);
  });

  it('filters by category', () => {
    expect(ids(applyFilterCriteria(catalog, { ...all, category: 'accessories' }))).toEqual(['food', 'water']);
    expect(applyFilterCriteria(catalog, { ...all, category: '' })).toHaveLength(5);
  });

  it('filters by inclusive price bounds in major units', () => {
    expect(ids(applyFilterCriteria(catalog, { ...all, priceMin: 49, priceMax: 199 }))).toEqual(['kit-24h', 'custom', 'food']);
    expect(ids(applyFilterCriteria(catalog, { ...all, priceMin: 200 }))).toEqual(['kit-72h']);
    expect(ids(applyFilterCriteria(catalog, { ...all, priceMax: 49 }))).toEqual(['food', 'water']);
  });

  it('ignores NaN bounds and swaps inverted ones', () => {
    expect(applyFilterCriteria(catalog, { ...all, priceMin: Number.NaN, priceMax: Number.NaN })).toHaveLength(5);
    expect(ids(applyFilterCriteria(catalog, { ...all, priceMin: 199, priceMax: 49 }))).toEqual(['kit-24h', 'custom', 'food']);
  });

  it('filters by stock and sale status', () => {
    expect(ids(applyFilterCriteria(catalog, { ...all, inStockOnly: true }))).not.toContain('water');
    expect(ids(applyFilterCriteria(catalog, { ...all, onSaleOnly: true }))).toEqual(['kit-24h', 'kit-72h', 'custom']);
  });

  it('sorts by price in both directions', () => {
    expect(ids(applyFilterCriteria(catalog, { sortBy: 'price-asc' }))).toEqual(['water', 'food', 'custom', 'kit-24h', 'kit-72h']);
    expect(ids(applyFilterCriteria(catalog, { sortBy: 'price-desc' }))).toEqual(['kit-72h', 'kit-24h', 'custom', 'food', 'water']);
  });

  it('sorts by rating and reviews, descending with unrated products last', () => {
    expect(ids(applyFilterCriteria(catalog, { sortBy: 'rating' }))).toEqual(['kit-72h', 'kit-24h', 'food', 'water', 'custom']);
    expect(ids(applyFilterCriteria(catalog, { sortBy: 'reviews' }))).toEqual(['kit-72h', 'kit-24h', 'food', 'water', 'custom']);
  });

  it('does not modify the input array', () => {
    const input = [...catalog];
    applyFilterCriteria(input, { sortBy: 'price-asc' });
    expect(input).toEqual(catalog);
  });

  describe('products with several variant prices', () => {
    // "Desde 39 €": 39, 69 and 129 € variants; the selected (first in stock) is the 69 € one.
    const kit = buildProduct({
      id: 'kit-24h',
      variants: [
        { id: 'kit-24h-1p', title: '1 persona', price: 39, inStock: false },
        { id: 'kit-24h-2p', title: '2 personas', price: 69 },
        { id: 'kit-24h-4p', title: '4 personas', price: 129 },
      ],
    });
    const lamp = buildProduct({ id: 'lamp', price: 50 });
    const radio = buildProduct({ id: 'radio', price: 100 });

    it('matches a price range when any variant price falls in it', () => {
      expect(ids(applyFilterCriteria([kit, lamp], { ...all, priceMin: 30, priceMax: 40 }))).toEqual(['kit-24h-2p']);
      expect(ids(applyFilterCriteria([kit, lamp], { ...all, priceMin: 120, priceMax: 130 }))).toEqual(['kit-24h-2p']);
      expect(ids(applyFilterCriteria([kit, lamp], { ...all, priceMin: 70, priceMax: 120 }))).toEqual([]);
    });

    it('sorts by the cheapest variant, the "Desde" price the card shows', () => {
      expect(ids(applyFilterCriteria([radio, lamp, kit], { sortBy: 'price-asc' }))).toEqual(['kit-24h-2p', 'lamp', 'radio']);
      expect(ids(applyFilterCriteria([kit, lamp, radio], { sortBy: 'price-desc' }))).toEqual(['radio', 'lamp', 'kit-24h-2p']);
    });
  });

  it('only returns products that match every criterion, and all of them', () => {
    const productArb = fc.record({
      cents: fc.integer({ min: 1, max: 50_000 }),
      discount: fc.option(fc.integer({ min: 1, max: 10_000 }), { nil: null }),
      category: fc.constantFrom('survival-kits', 'accessories'),
      inStock: fc.boolean(),
    });
    const criteriaArb = fc.record({
      category: fc.option(fc.constantFrom('survival-kits', 'accessories'), { nil: undefined }),
      priceMin: fc.option(fc.integer({ min: 0, max: 500 }), { nil: undefined }),
      priceMax: fc.option(fc.integer({ min: 0, max: 500 }), { nil: undefined }),
      inStockOnly: fc.boolean(),
      onSaleOnly: fc.boolean(),
      sortBy: fc.constantFrom(...SORT_OPTIONS),
    });

    fc.assert(
      fc.property(fc.array(productArb, { maxLength: 30 }), criteriaArb, (rows, criteria) => {
        const products = rows.map((row, index) =>
          buildProduct({
            id: `p-${index}`,
            price: row.cents / 100,
            originalPrice: row.discount === null ? null : (row.cents + row.discount) / 100,
            category: row.category,
            inStock: row.inStock,
          }),
        );
        const lo = Math.min(criteria.priceMin ?? -Infinity, criteria.priceMax ?? Infinity);
        const hi = Math.max(criteria.priceMin ?? -Infinity, criteria.priceMax ?? Infinity);
        const matches = (product: Product) =>
          (!criteria.category || product.category === criteria.category) &&
          product.price.amount >= lo &&
          product.price.amount <= hi &&
          (!criteria.inStockOnly || product.inStock) &&
          (!criteria.onSaleOnly || product.isOnSale());

        const result = applyFilterCriteria(products, criteria);
        expect(new Set(ids(result))).toEqual(new Set(ids(products.filter(matches))));
        expect(result).toHaveLength(products.filter(matches).length);
      }),
    );
  });
});
