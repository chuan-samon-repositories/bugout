import { describe, expect, it } from 'vitest';
import { JsonProductAdapter } from './JsonProductAdapter';
import { kitsContaining, kitsIn } from '@/application/catalog/kits';
import { NotFoundError } from '@/domain/errors';
import { ProductId } from '@/domain/value-objects/ProductId';

const KITS = ['kit-24h', 'kit-72h', 'kit-custom'];
const LOOSE = [
  'mochila-30l',
  'mochila-65l',
  'manta-termica',
  'poncho-termico',
  'cuerda-paracaidismo',
  'mini-estufa-gas',
  'radio-solar',
  'frontal',
  'lampara-camping',
  'kit-cocina',
  'bolsa-seca',
  'silbato',
  'cantimplora-1l',
  'bolsa-hermetica',
  'cinta-adhesiva',
  'neceser',
  'kit-medicina',
];
const CATEGORIES = ['kits', 'agua', 'luz-y-energia', 'primeros-auxilios', 'refugio-y-abrigo', 'herramientas', 'higiene'];

describe('JsonProductAdapter with the bundled catalog', () => {
  const adapter = new JsonProductAdapter({ currency: 'EUR' });

  it('parses the three kits followed by the loose products', async () => {
    const products = await adapter.findAll();
    expect(products.map((product) => product.slug)).toEqual([...KITS, ...LOOSE]);
    expect(kitsIn(products).map((kit) => kit.slug)).toEqual(KITS);
    for (const product of products) {
      expect(product.price.currency).toBe('EUR');
      expect(CATEGORIES).toContain(product.category);
      expect(product.description.length).toBeGreaterThan(0);
      product.images.forEach((image) => expect(image.alt).toBe(product.name));
    }
  });

  it('has unique slugs and variant ids', async () => {
    const products = await adapter.findAll();
    const slugs = products.map((product) => product.slug);
    const ids = products.flatMap((product) => product.variants.map((variant) => variant.id.value));
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sells Kit 24h and Kit 72h for 1, 2 or 4 people and Kit Custom as a single build-your-own base', async () => {
    const summary = async (slug: string) =>
      (await adapter.findBySlug(slug)).variants.map((variant) => [variant.id.value, variant.title, variant.price.amount]);
    expect(await summary('kit-24h')).toEqual([
      ['kit-24h-1p', '1 persona', 39],
      ['kit-24h-2p', '2 personas', 69],
      ['kit-24h-4p', '4 personas', 129],
    ]);
    expect(await summary('kit-72h')).toEqual([
      ['kit-72h-1p', '1 persona', 119],
      ['kit-72h-2p', '2 personas', 199],
      ['kit-72h-4p', '4 personas', 359],
    ]);
    const custom = await adapter.findBySlug('kit-custom');
    expect(custom.hasVariants()).toBe(false);
    expect(custom.details?.kit).toMatchObject({ label: 'CUSTOM', buildYourOwn: true });
  });

  it('has no fabricated merchandising: no ratings, badges or strike-through prices', async () => {
    for (const product of await adapter.findAll()) {
      expect(product.rating).toBeNull();
      expect(product.badge).toBeNull();
      expect(product.variants.every((variant) => variant.originalPrice === null)).toBe(true);
    }
  });

  it('gives every loose product its own photo and leaves kit photos to the commerce backend', async () => {
    for (const product of await adapter.findAll()) {
      if (product.isKit()) {
        expect(product.images).toEqual([]);
      } else {
        expect(product.images).toEqual([
          { url: `/images/products/${product.slug}.jpg`, alt: product.name, width: 900, height: 900 },
        ]);
      }
    }
  });

  it('derives "included in" from kit contents', async () => {
    const products = await adapter.findAll();
    expect(kitsContaining('manta-termica', products).map((kit) => kit.slug)).toEqual(['kit-24h', 'kit-72h']);
    expect(kitsContaining('mochila-30l', products).map((kit) => kit.slug)).toEqual(['kit-72h']);
    expect(kitsContaining('mochila-65l', products)).toEqual([]);
  });

  it('finds products by slug and by any variant id', async () => {
    expect((await adapter.findById(new ProductId('kit-medicina'))).slug).toBe('kit-medicina');
    expect((await adapter.findBySlug('silbato')).id.value).toBe('silbato');
    const twoPeople = await adapter.findById(new ProductId('kit-72h-2p'));
    expect(twoPeople.slug).toBe('kit-72h');
    expect(twoPeople.price.amount).toBe(199);
    expect(twoPeople.variantTitle).toBe('2 personas');
  });

  it('throws NotFoundError for unknown ids and slugs', async () => {
    await expect(adapter.findById(new ProductId('nope'))).rejects.toBeInstanceOf(NotFoundError);
    await expect(adapter.findBySlug('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns a copy of the list', async () => {
    const first = await adapter.findAll();
    first.pop();
    expect(await adapter.findAll()).toHaveLength(KITS.length + LOOSE.length);
  });
});

describe('JsonProductAdapter with custom data', () => {
  it('rejects malformed data with a descriptive error', async () => {
    const adapter = new JsonProductAdapter({ currency: 'EUR', data: [{ id: 'x' }] });
    await expect(adapter.findAll()).rejects.toThrow(/Invalid product catalog at products\[0\]\.slug/);
  });
});
