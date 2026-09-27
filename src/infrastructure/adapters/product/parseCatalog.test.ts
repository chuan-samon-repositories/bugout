import { describe, expect, it } from 'vitest';
import { parseCatalog } from './parseCatalog';

const valid = {
  id: 'kit',
  slug: 'kit',
  name: 'Kit',
  description: 'Descripción',
  price: 19.99,
  originalPrice: null,
  category: 'survival-kits',
  inStock: true,
  badge: null,
  featured: false,
  rating: null,
  images: [{ url: '/a.png', alt: 'A', width: 10, height: 20 }],
  details: null,
};

describe('parseCatalog', () => {
  it('maps valid records to products in the given currency', () => {
    const [product] = parseCatalog([valid], 'EUR');
    expect(product.id.value).toBe('kit');
    expect(product.price.minor).toBe(1999);
    expect(product.price.currency).toBe('EUR');
    expect(product.originalPrice).toBeNull();
    expect(product.rating).toBeNull();
    expect(product.images).toEqual([{ url: '/a.png', alt: 'A', width: 10, height: 20 }]);
  });

  it('accepts omitted optional fields', () => {
    const required: Record<string, unknown> = { ...valid };
    for (const key of ['originalPrice', 'badge', 'rating', 'details']) delete required[key];
    const [product] = parseCatalog([required], 'EUR');
    expect(product.badge).toBeNull();
    expect(product.details).toBeNull();
  });

  it('parses details', () => {
    const details = {
      features: ['Ligera'],
      specifications: [{ label: 'Peso', value: '1 kg' }],
      contents: [{ item: 'Linterna', quantity: '1' }],
    };
    const [product] = parseCatalog([{ ...valid, details }], 'EUR');
    expect(product.details).toEqual({ ...details, longDescription: undefined });
  });

  it.each([
    ['a non-array root', { products: [] }, /at products: expected an array/],
    ['a non-object record', [42], /products\[0\]: expected an object/],
    ['a missing name', [{ ...valid, name: undefined }], /products\[0\]\.name: expected a string/],
    ['a string price', [{ ...valid, price: '19.99' }], /products\[0\]\.price: expected a number/],
    ['a bad stock flag', [{ ...valid, inStock: 'yes' }], /products\[0\]\.inStock: expected a boolean/],
    ['a malformed image', [{ ...valid, images: [{ url: '/a.png' }] }], /products\[0\]\.images\[0\]\.alt/],
    ['a malformed spec', [{ ...valid, details: { features: [], specifications: [{}], contents: [] } }], /details\.specifications\[0\]\.label/],
    ['a domain rule violation', [{ ...valid, slug: 'Not A Slug' }], /products\[0\]: Invalid product slug/],
    ['an out-of-range rating', [{ ...valid, rating: { average: 7, count: 1 } }], /products\[0\]: Rating must be between/],
    ['duplicate ids', [valid, { ...valid, slug: 'other' }], /duplicate id kit/],
    ['duplicate slugs', [valid, { ...valid, id: 'other' }], /duplicate slug kit/],
  ])('rejects %s with a descriptive error', (_label, data, message) => {
    expect(() => parseCatalog(data, 'EUR')).toThrow(message);
  });

  describe('kits and variants', () => {
    const loose = { ...valid, id: 'manta', slug: 'manta', name: 'Manta' };
    const kit = {
      slug: 'kit-72h',
      name: 'Kit 72h',
      description: 'Tres días',
      category: 'kits',
      badge: null,
      featured: true,
      rating: null,
      images: [],
      variants: [
        { id: 'kit-72h-1p', title: '1 persona', options: [{ name: 'Personas', value: '1' }], price: 119, inStock: false },
        { id: 'kit-72h-2p', title: '2 personas', options: [{ name: 'Personas', value: '2' }], price: 199, inStock: true },
      ],
      details: {
        features: [],
        specifications: [],
        contents: [
          { item: 'Manta', quantity: '2', productSlug: 'manta' },
          { item: 'Agua', quantity: '6' },
        ],
        kit: { label: '72H', idealFor: 'Evacuaciones', buildYourOwn: false },
        related: ['manta'],
      },
    };

    it('parses variants and selects the first one in stock', () => {
      const [product] = parseCatalog([kit, loose], 'EUR');
      expect(product.variants.map((variant) => variant.id.value)).toEqual(['kit-72h-1p', 'kit-72h-2p']);
      expect(product.id.value).toBe('kit-72h-2p');
      expect(product.price.minor).toBe(19900);
      expect(product.variants[0].options).toEqual([{ name: 'Personas', value: '1' }]);
    });

    it('parses kit info, related slugs and content references', () => {
      const [product] = parseCatalog([kit, loose], 'EUR');
      expect(product.isKit()).toBe(true);
      expect(product.details?.kit).toEqual({ label: '72H', idealFor: 'Evacuaciones' });
      expect(product.details?.related).toEqual(['manta']);
      expect(product.details?.contents).toEqual([
        { item: 'Manta', quantity: '2', productSlug: 'manta' },
        { item: 'Agua', quantity: '6' },
      ]);
    });

    it('reports malformed variants with their path', () => {
      const broken = { ...kit, variants: [{ ...kit.variants[0], price: 'x' }] };
      expect(() => parseCatalog([broken, loose], 'EUR')).toThrow(/products\[0\]\.variants\[0\]\.price: expected a number/);
      const noLabel = { ...kit, details: { ...kit.details, kit: {} } };
      expect(() => parseCatalog([noLabel, loose], 'EUR')).toThrow(/products\[0\]\.details\.kit\.label/);
    });

    it('rejects references to products that are not in the catalog', () => {
      expect(() => parseCatalog([kit], 'EUR')).toThrow(/products\[0\]\.details\.contents\[0\]\.productSlug: unknown product manta/);
      const badRelated = { ...kit, details: { ...kit.details, contents: [], related: ['nope'] } };
      expect(() => parseCatalog([badRelated, loose], 'EUR')).toThrow(/details\.related\[0\]: unknown product nope/);
    });

    it('rejects a variant id that clashes with another product id', () => {
      const clash = { ...loose, id: 'kit-72h-1p', slug: 'otro' };
      expect(() => parseCatalog([kit, loose, clash], 'EUR')).toThrow(/duplicate id kit-72h-1p/);
    });
  });
});
