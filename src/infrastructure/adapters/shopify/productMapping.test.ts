import { describe, expect, it } from 'vitest';
import { mapShopifyProduct, slugifyCategory } from './productMapping';
import { peopleVariant, productNode, variantGid, variantNode } from '@/infrastructure/testing/shopifyFixtures';

const metafield = (value: unknown) => ({ value: typeof value === 'string' ? value : JSON.stringify(value) });

describe('mapShopifyProduct', () => {
  it('maps the core fields', () => {
    const product = mapShopifyProduct(
      productNode({ tags: ['Featured', 'mochilas'], badge: { value: 'BESTSELLER' } }),
      variantNode(7, { price: { amount: '199.95', currencyCode: 'EUR' }, compareAtPrice: { amount: '249.0', currencyCode: 'EUR' } }),
    );
    expect(product.id.value).toBe(variantGid(7));
    expect(product.slug).toBe('mochila-24h');
    expect(product.name).toBe('Mochila 24H');
    expect(product.price.minor).toBe(19995);
    expect(product.originalPrice?.minor).toBe(24900);
    expect(product.category).toBe('survival-kits');
    expect(product.inStock).toBe(true);
    expect(product.badge).toBe('BESTSELLER');
    expect(product.featured).toBe(true);
    expect(product.rating).toBeNull();
    expect(product.details).toBeNull();
  });

  it('maps availability, missing badge and tags', () => {
    const product = mapShopifyProduct(productNode({ badge: { value: '  ' } }), variantNode(1, { availableForSale: false }));
    expect(product.inStock).toBe(false);
    expect(product.badge).toBeNull();
    expect(product.featured).toBe(false);
    expect(product.originalPrice).toBeNull();
  });

  it('maps images with the title as alt fallback', () => {
    const product = mapShopifyProduct(
      productNode({
        images: {
          nodes: [
            { url: 'https://cdn.shopify.com/a.png', altText: 'Vista frontal', width: 800, height: 600 },
            { url: 'https://cdn.shopify.com/b.png', altText: null, width: null, height: null },
          ],
        },
      }),
      variantNode(1),
    );
    expect(product.images).toEqual([
      { url: 'https://cdn.shopify.com/a.png', alt: 'Vista frontal', width: 800, height: 600 },
      { url: 'https://cdn.shopify.com/b.png', alt: 'Mochila 24H', width: undefined, height: undefined },
    ]);
  });

  it('normalises the rating metafield to a 0–5 scale', () => {
    const rate = (rating: unknown, count?: string) =>
      mapShopifyProduct(
        productNode({ rating: metafield(rating), ratingCount: count === undefined ? null : { value: count } }),
        variantNode(1),
      ).rating;

    expect(rate({ value: '4.5', scale_min: '1.0', scale_max: '5.0' }, '12')).toEqual({ average: 4.5, count: 12 });
    expect(rate({ value: '8', scale_min: '0', scale_max: '10' }, '3')).toEqual({ average: 4, count: 3 });
    expect(rate({ value: '4.2' })).toEqual({ average: 4.2, count: 0 });
    expect(rate({ value: '9', scale_max: '5' }, 'many')).toEqual({ average: 5, count: 0 });
    expect(rate('not json')).toBeNull();
    expect(rate({ value: 'x', scale_max: '5' })).toBeNull();
  });

  it('parses details metafields and tolerates missing or broken ones', () => {
    const product = mapShopifyProduct(
      productNode({
        features: metafield(['Ligera', 42, 'Resistente']),
        specifications: metafield([{ label: 'Peso', value: '3 kg' }, { label: 'Sin valor' }]),
        contents: { value: '{broken' },
      }),
      variantNode(1),
    );
    expect(product.details).toEqual({
      features: ['Ligera', 'Resistente'],
      specifications: [{ label: 'Peso', value: '3 kg' }],
      contents: [],
    });

    const onlyContents = mapShopifyProduct(
      productNode({ contents: metafield([{ item: 'Linterna', quantity: '1' }]), features: metafield('{bad') }),
      variantNode(1),
    );
    expect(onlyContents.details).toEqual({ features: [], specifications: [], contents: [{ item: 'Linterna', quantity: '1' }] });
  });

  it('keeps Shopify currency so the cart can reject mismatches', () => {
    const product = mapShopifyProduct(productNode(), variantNode(1, { price: { amount: '10.00', currencyCode: 'USD' } }));
    expect(product.price.currency).toBe('USD');
  });
});

describe('slugifyCategory', () => {
  it('slugifies product types', () => {
    expect(slugifyCategory('Survival Kits')).toBe('survival-kits');
    expect(slugifyCategory('  Accesorios  ')).toBe('accesorios');
    expect(slugifyCategory('Primeros auxilios & Botiquín')).toBe('primeros-auxilios-botiquin');
    expect(slugifyCategory('')).toBe('general');
    expect(slugifyCategory('***')).toBe('general');
  });
});

describe('mapShopifyProduct: kits and variants', () => {
  it('treats Shopify\'s "Default Title" variant as no variant choice', () => {
    const product = mapShopifyProduct(productNode(), variantNode(1));
    expect(product.hasVariants()).toBe(false);
    expect(product.variantTitle).toBeNull();
    expect(product.selectedVariant().options).toEqual([]);
  });

  it('keeps every variant with its options and selects the given one', () => {
    const variants = [peopleVariant(1, 1, '39.0'), peopleVariant(2, 2, '69.0'), peopleVariant(4, 4, '129.0')];
    const product = mapShopifyProduct(productNode({ handle: 'kit-24h' }), variants[1], variants);
    expect(product.id.value).toBe(variantGid(2));
    expect(product.variantTitle).toBe('2 personas');
    expect(product.variants.map((variant) => variant.options)).toEqual([
      [{ name: 'Personas', value: '1' }],
      [{ name: 'Personas', value: '2' }],
      [{ name: 'Personas', value: '4' }],
    ]);
    expect(product.priceRange().max.amount).toBe(129);
  });

  it('reads custom.kit, custom.related and content handles', () => {
    const product = mapShopifyProduct(
      productNode({
        productType: 'Kits',
        kit: metafield({ label: ' 72H ', idealFor: 'Evacuaciones', buildYourOwn: false }),
        related: metafield(['lampara-camping', 'mochila-65l', 3]),
        contents: metafield([
          { item: 'Manta térmica', quantity: '2', handle: 'manta-termica' },
          { item: 'Agua', quantity: '6', handle: '' },
        ]),
      }),
      variantNode(1),
    );
    expect(product.category).toBe('kits');
    expect(product.isKit()).toBe(true);
    expect(product.details?.kit).toEqual({ label: '72H', idealFor: 'Evacuaciones' });
    expect(product.details?.related).toEqual(['lampara-camping', 'mochila-65l']);
    expect(product.details?.contents).toEqual([
      { item: 'Manta térmica', quantity: '2', productSlug: 'manta-termica' },
      { item: 'Agua', quantity: '6' },
    ]);
  });

  it('ignores a kit metafield without a label', () => {
    const product = mapShopifyProduct(productNode({ kit: metafield({ idealFor: 'x' }) }), variantNode(1));
    expect(product.isKit()).toBe(false);
  });

  it('matches the local category slugs for the Spanish product types', () => {
    expect(['Kits', 'Agua', 'Luz y energía', 'Primeros auxilios', 'Refugio y abrigo', 'Herramientas', 'Higiene'].map(slugifyCategory)).toEqual([
      'kits',
      'agua',
      'luz-y-energia',
      'primeros-auxilios',
      'refugio-y-abrigo',
      'herramientas',
      'higiene',
    ]);
  });
});

