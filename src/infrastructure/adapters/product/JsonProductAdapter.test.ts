import { describe, expect, it } from 'vitest';
import { JsonProductAdapter } from './JsonProductAdapter';
import { NotFoundError } from '@/domain/errors';
import { ProductId } from '@/domain/value-objects/ProductId';

const EXPECTED_IDS = [
  '24h-survival-backpack',
  '72h-survival-backpack',
  'custom-survival-kit',
  'emergency-food-pack',
  'water-purification-kit',
  'first-aid-pro',
];

describe('JsonProductAdapter with the bundled catalog', () => {
  const adapter = new JsonProductAdapter({ currency: 'EUR' });

  it('parses every product in products.json', async () => {
    const products = await adapter.findAll();
    expect(products.map((product) => product.id.value)).toEqual(EXPECTED_IDS);
    for (const product of products) {
      expect(product.slug).toBe(product.id.value);
      expect(product.price.currency).toBe('EUR');
      expect(product.details?.features.length).toBeGreaterThan(0);
      expect(product.details?.specifications.length).toBeGreaterThan(0);
      expect(product.details?.contents.length).toBeGreaterThan(0);
      product.images.forEach((image) => expect(image.alt).toBe(product.name));
    }
  });

  it('has unique slugs', async () => {
    const slugs = (await adapter.findAll()).map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('keeps the catalog prices and merchandising flags', async () => {
    const byId = new Map((await adapter.findAll()).map((product) => [product.id.value, product]));
    const summary = (id: string) => {
      const product = byId.get(id)!;
      return [product.price.amount, product.originalPrice?.amount ?? null, product.badge, product.featured];
    };
    expect(summary('24h-survival-backpack')).toEqual([199, 249, null, true]);
    expect(summary('72h-survival-backpack')).toEqual([299, 399, 'PREMIUM', true]);
    expect(summary('custom-survival-kit')).toEqual([149, 199, 'SALE', false]);
    expect(summary('emergency-food-pack')).toEqual([49, null, null, false]);
    expect(summary('water-purification-kit')).toEqual([39, null, null, false]);
    expect(summary('first-aid-pro')).toEqual([89, 119, 'SALE', false]);
  });

  it('labels warranties honestly: the statutory guarantee is not a feature', async () => {
    const warranties = (await adapter.findAll()).flatMap((product) =>
      (product.details?.specifications ?? [])
        .filter((spec) => /garant/i.test(spec.label))
        .map((spec) => [product.slug, spec.label, spec.value]),
    );
    expect(warranties).toEqual([
      ['24h-survival-backpack', 'Garantía legal', '3 años'],
      ['72h-survival-backpack', 'Garantía comercial', '5 años'],
    ]);
  });

  it('only shows the backpack photo on survival kits', async () => {
    for (const product of await adapter.findAll()) {
      if (product.category === 'survival-kits') {
        expect(product.images).toEqual([
          { url: '/images/products/backpack.png', alt: product.name, width: 1024, height: 1536 },
        ]);
      } else {
        expect(product.images).toEqual([]);
      }
    }
  });

  it('finds products by id and slug', async () => {
    expect((await adapter.findById(new ProductId('first-aid-pro'))).slug).toBe('first-aid-pro');
    expect((await adapter.findBySlug('emergency-food-pack')).id.value).toBe('emergency-food-pack');
  });

  it('throws NotFoundError for unknown ids and slugs', async () => {
    await expect(adapter.findById(new ProductId('nope'))).rejects.toBeInstanceOf(NotFoundError);
    await expect(adapter.findBySlug('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns a copy of the list', async () => {
    const first = await adapter.findAll();
    first.pop();
    expect(await adapter.findAll()).toHaveLength(6);
  });
});

describe('JsonProductAdapter with custom data', () => {
  it('rejects malformed data with a descriptive error', async () => {
    const adapter = new JsonProductAdapter({ currency: 'EUR', data: [{ id: 'x' }] });
    await expect(adapter.findAll()).rejects.toThrow(/Invalid product catalog at products\[0\]\.slug/);
  });
});
