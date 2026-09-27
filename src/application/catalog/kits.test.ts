import { describe, expect, it } from 'vitest';
import {
  compareKits,
  comparableKits,
  findByVariantId,
  includedInIndex,
  kitsContaining,
  kitsIn,
  looseProductsIn,
  relatedProducts,
  resolveContents,
} from './kits';
import { buildProduct } from '@/domain/testing/buildProduct';

const details = (overrides: object = {}) => ({ features: [], specifications: [], contents: [], ...overrides });

const manta = buildProduct({ id: 'manta', name: 'Manta', price: 6, category: 'refugio-y-abrigo' });
const radio = buildProduct({ id: 'radio', name: 'Radio', price: 24, category: 'luz-y-energia' });
const kit24 = buildProduct({
  id: 'kit-24h',
  name: 'Kit 24h',
  category: 'kits',
  variants: [
    { id: 'kit-24h-1p', title: '1 persona', price: 39, options: [{ name: 'Personas', value: '1' }] },
    { id: 'kit-24h-2p', title: '2 personas', price: 69, options: [{ name: 'Personas', value: '2' }] },
  ],
  details: details({
    kit: { label: '24H' },
    specifications: [{ label: 'Peso', value: '1,8 kg' }],
    contents: [
      { item: 'Manta', quantity: '1', productSlug: 'manta' },
      { item: 'Agua', quantity: '2' },
    ],
    related: ['radio', 'missing', 'kit-24h'],
  }),
});
const kit72 = buildProduct({
  id: 'kit-72h',
  name: 'Kit 72h',
  category: 'kits',
  price: 119,
  details: details({
    kit: { label: '72H' },
    specifications: [
      { label: 'Dimensiones', value: '45 × 30 × 20 cm' },
      { label: 'Peso', value: '5,4 kg' },
    ],
    contents: [
      { item: 'Manta', quantity: '2', productSlug: 'manta' },
      { item: 'Radio', quantity: '1', productSlug: 'radio' },
      { item: 'Agua', quantity: '6' },
    ],
  }),
});
const custom = buildProduct({
  id: 'kit-custom',
  category: 'kits',
  price: 59,
  details: details({ kit: { label: 'CUSTOM', buildYourOwn: true } }),
});
const catalog = [kit24, kit72, custom, manta, radio];

describe('kit helpers', () => {
  it('splits kits from loose products, keeping catalog order', () => {
    expect(kitsIn(catalog).map((p) => p.slug)).toEqual(['kit-24h', 'kit-72h', 'kit-custom']);
    expect(looseProductsIn(catalog).map((p) => p.slug)).toEqual(['manta', 'radio']);
    expect(comparableKits(catalog).map((p) => p.slug)).toEqual(['kit-24h', 'kit-72h']);
  });

  it('finds the kits that include a product', () => {
    expect(kitsContaining('manta', catalog).map((p) => p.slug)).toEqual(['kit-24h', 'kit-72h']);
    expect(kitsContaining('radio', catalog).map((p) => p.slug)).toEqual(['kit-72h']);
    expect(kitsContaining('kit-24h', catalog)).toEqual([]);
  });

  it('indexes, per product slug, the names of the kits that include it', () => {
    expect(includedInIndex(catalog)).toEqual({ manta: ['Kit 24h', 'Kit 72h'], radio: ['Kit 72h'] });
  });

  it('joins content lines with their catalog products', () => {
    const lines = resolveContents(kit24, catalog);
    expect(lines.map((line) => [line.item, line.quantity, line.product?.slug ?? null])).toEqual([
      ['Manta', '1', 'manta'],
      ['Agua', '2', null],
    ]);
  });

  it('lists related products in order, skipping unknown slugs and the product itself', () => {
    expect(relatedProducts(kit24, catalog).map((p) => p.slug)).toEqual(['radio']);
    expect(relatedProducts(manta, catalog)).toEqual([]);
  });

  it('resolves any variant id to its product with that variant selected', () => {
    expect(findByVariantId(catalog, 'kit-24h-2p')?.price.amount).toBe(69);
    expect(findByVariantId(catalog, 'manta')?.slug).toBe('manta');
    expect(findByVariantId(catalog, 'nope')).toBeNull();
  });

  it('builds comparison rows: price from, variant choices, every spec and the item count', () => {
    const rows = compareKits([kit24, kit72]);
    expect(rows.map((row) => row.kind)).toEqual(['price', 'variants', 'spec', 'spec', 'items']);
    expect(rows[0]).toMatchObject({ kind: 'price' });
    expect(rows[0].kind === 'price' && rows[0].values.map((money) => money.amount)).toEqual([39, 119]);
    expect(rows[1]).toEqual({ kind: 'variants', label: 'Personas', values: [['1', '2'], []] });
    expect(rows[2]).toEqual({ kind: 'spec', label: 'Peso', values: ['1,8 kg', '5,4 kg'] });
    expect(rows[3]).toEqual({ kind: 'spec', label: 'Dimensiones', values: [null, '45 × 30 × 20 cm'] });
    expect(rows[4]).toEqual({ kind: 'items', values: [2, 3] });
    expect(compareKits([])).toEqual([]);
  });

  it('lists people counts in the variant row whether option values are "2" or "2 personas"', () => {
    const shopifyStyle = buildProduct({
      id: 'kit-72h-shopify',
      category: 'kits',
      variants: [
        { id: 'a', title: '1 persona', price: 59, options: [{ name: 'Personas', value: '1 persona' }] },
        { id: 'b', title: '4 personas', price: 199, options: [{ name: 'Personas', value: '4 personas' }] },
      ],
      details: details({ kit: { label: '72H' } }),
    });
    const row = compareKits([kit24, shopifyStyle]).find((candidate) => candidate.kind === 'variants');
    expect(row).toEqual({ kind: 'variants', label: 'Personas', values: [['1', '2'], ['1', '4']] });
  });

  it('omits the variant row when no kit has variants', () => {
    expect(compareKits([kit72]).map((row) => row.kind)).toEqual(['price', 'spec', 'spec', 'items']);
  });
});
