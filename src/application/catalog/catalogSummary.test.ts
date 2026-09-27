import { describe, expect, it } from 'vitest';
import { priceBounds, summarizeCategories } from './catalogSummary';
import { buildProduct } from '@/domain/testing/buildProduct';

describe('summarizeCategories', () => {
  it('counts products per category in first-seen order', () => {
    const products = [
      buildProduct({ id: 'a', category: 'accessories' }),
      buildProduct({ id: 'b', category: 'survival-kits' }),
      buildProduct({ id: 'c', category: 'accessories' }),
    ];
    expect(summarizeCategories(products)).toEqual([
      { slug: 'accessories', count: 2 },
      { slug: 'survival-kits', count: 1 },
    ]);
  });

  it('returns an empty list for no products', () => {
    expect(summarizeCategories([])).toEqual([]);
  });
});

describe('priceBounds', () => {
  it('floors the minimum and ceils the maximum', () => {
    const products = [buildProduct({ id: 'a', price: 39.95 }), buildProduct({ id: 'b', price: 298.5 }), buildProduct({ id: 'c', price: 100 })];
    expect(priceBounds(products)).toEqual({ min: 39, max: 299 });
  });

  it('keeps whole amounts unchanged', () => {
    expect(priceBounds([buildProduct({ price: 49 })])).toEqual({ min: 49, max: 49 });
  });

  it('spans every variant price, not just the selected ones', () => {
    const kit = buildProduct({
      id: 'kit',
      variants: [
        { id: 'kit-2p', title: '2 personas', price: 69.5 },
        { id: 'kit-1p', title: '1 persona', price: 39.9 },
        { id: 'kit-4p', title: '4 personas', price: 129.1 },
      ],
    });
    expect(priceBounds([kit, buildProduct({ id: 'lamp', price: 50 })])).toEqual({ min: 39, max: 130 });
  });

  it('is null for an empty list', () => {
    expect(priceBounds([])).toBeNull();
  });
});
