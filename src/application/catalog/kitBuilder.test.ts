import { describe, expect, it } from 'vitest';
import { buildProduct } from '@/domain/testing/buildProduct';
import type { ProductDetails } from '@/domain/entities/product/Product';
import { builderBases, builderGroups, builderPresets, builderTotal } from './kitBuilder';

const details = (overrides: Partial<ProductDetails>): ProductDetails => ({
  features: [],
  specifications: [],
  contents: [],
  ...overrides,
});

const backpack30 = buildProduct({ id: 'mochila-30l', category: 'herramientas', price: 59 });
const backpack65 = buildProduct({ id: 'mochila-65l', category: 'herramientas', price: 89 });
const blanket = buildProduct({ id: 'manta', category: 'refugio', price: 6 });
const torch = buildProduct({ id: 'frontal', category: 'luz', price: 14 });
const lamp = buildProduct({ id: 'lampara', category: 'luz', price: 16, inStock: false });
const rope = buildProduct({ id: 'cuerda', category: 'herramientas', price: 8 });

const custom = buildProduct({
  id: 'kit-custom',
  category: 'kits',
  details: details({
    kit: { label: 'CUSTOM', buildYourOwn: true },
    contents: [
      { item: 'Mochila 30L', quantity: '1', productSlug: 'mochila-30l' },
      { item: 'Mochila 65L', quantity: '1', productSlug: 'mochila-65l' },
      { item: 'Mochila 30L otra vez', quantity: '1', productSlug: 'mochila-30l' },
    ],
  }),
});

const kit72 = buildProduct({
  id: 'kit-72h',
  name: 'Kit 72h',
  category: 'kits',
  details: details({
    kit: { label: '72H' },
    contents: [
      { item: 'Mochila 30L', quantity: '1', productSlug: 'mochila-30l' },
      { item: 'Manta térmica', quantity: '2', productSlug: 'manta' },
      { item: 'Manta extra', quantity: 'un par', productSlug: 'manta' },
      { item: 'Frontal', quantity: '1', productSlug: 'frontal' },
      { item: 'Lámpara', quantity: '1', productSlug: 'lampara' },
      { item: 'Botellas de agua', quantity: '6' },
    ],
  }),
});

const kit24 = buildProduct({
  id: 'kit-24h',
  name: 'Kit 24h',
  category: 'kits',
  details: details({ kit: { label: '24H' }, contents: [{ item: 'Barritas', quantity: '2' }] }),
});

const catalog = [kit24, kit72, custom, backpack30, backpack65, blanket, torch, lamp, rope];

describe('builderBases', () => {
  it('lists the catalog products the kit links to, once each and in order', () => {
    expect(builderBases(custom, catalog).map((product) => product.slug)).toEqual(['mochila-30l', 'mochila-65l']);
  });

  it('is empty when the kit links to no product', () => {
    expect(builderBases(kit24, catalog)).toEqual([]);
  });
});

describe('builderGroups', () => {
  it('groups the loose products except the bases by category, in catalog order', () => {
    expect(
      builderGroups(custom, catalog).map((group) => [group.category, group.products.map((product) => product.slug)]),
    ).toEqual([
      ['refugio', ['manta']],
      ['luz', ['frontal', 'lampara']],
      ['herramientas', ['cuerda']],
    ]);
  });
});

describe('builderPresets', () => {
  it('turns each comparable kit into a selection and lists what cannot be added', () => {
    expect(builderPresets(custom, catalog)).toEqual([
      {
        kitSlug: 'kit-72h',
        kitName: 'Kit 72h',
        baseSlug: 'mochila-30l',
        quantities: { manta: 3, frontal: 1 },
        unavailable: ['Lámpara', 'Botellas de agua'],
      },
    ]);
  });

  it('leaves out kits with nothing the builder offers', () => {
    expect(builderPresets(custom, catalog).map((preset) => preset.kitSlug)).not.toContain('kit-24h');
  });
});

describe('builderTotal', () => {
  it('adds up price × quantity', () => {
    expect(builderTotal([{ product: backpack30, quantity: 1 }, { product: blanket, quantity: 3 }], 'EUR').minor).toBe(7700);
  });

  it('is zero without lines', () => {
    expect(builderTotal([], 'EUR').isZero()).toBe(true);
  });
});
