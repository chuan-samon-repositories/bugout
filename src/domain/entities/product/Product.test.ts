import { describe, expect, it } from 'vitest';
import { Product } from './Product';
import { buildProduct } from '@/domain/testing/buildProduct';
import { Money } from '@/domain/value-objects/Money';
import { NotFoundError, ValidationError } from '@/domain/errors';
import { ProductId } from '@/domain/value-objects/ProductId';

describe('Product', () => {
  it('accepts kebab-case slugs', () => {
    for (const slug of ['a', '24h-survival-backpack', 'first-aid-pro', 'kit-2']) {
      expect(buildProduct({ slug }).slug).toBe(slug);
    }
  });

  it('rejects slugs that are not URL-safe kebab-case', () => {
    for (const slug of ['', 'Mochila', 'with space', '-leading', 'trailing-', 'double--dash', 'ñandú', 'a/b']) {
      expect(() => buildProduct({ slug })).toThrow(ValidationError);
    }
  });

  it('rejects an empty name and a zero price', () => {
    expect(() => buildProduct({ name: '   ' })).toThrow(ValidationError);
    expect(() => buildProduct({ price: 0 })).toThrow(ValidationError);
  });

  it('rejects an original price in another currency', () => {
    const base = buildProduct({ price: 10 });
    expect(() =>
      Product.create({ ...base, images: [], originalPrice: Money.fromMajor(20, 'USD') }),
    ).toThrow(ValidationError);
    expect(Product.create({ ...base, images: [], originalPrice: Money.fromMajor(20, 'EUR') }).isOnSale()).toBe(true);
  });

  it('allows a null rating and validates provided ratings', () => {
    const unrated = buildProduct({ rating: null });
    expect(unrated.rating).toBeNull();
    expect(unrated.hasReviews()).toBe(false);

    expect(() => buildProduct({ rating: { average: 5.1, count: 1 } })).toThrow(ValidationError);
    expect(() => buildProduct({ rating: { average: -0.1, count: 1 } })).toThrow(ValidationError);
    expect(() => buildProduct({ rating: { average: 4, count: 1.5 } })).toThrow(ValidationError);
    expect(() => buildProduct({ rating: { average: 4, count: -1 } })).toThrow(ValidationError);
  });

  it('has reviews only when the rating has a positive count', () => {
    expect(buildProduct({ rating: { average: 4.5, count: 12 } }).hasReviews()).toBe(true);
    expect(buildProduct({ rating: { average: 0, count: 0 } }).hasReviews()).toBe(false);
  });

  it('is on sale only when the original price is higher', () => {
    expect(buildProduct({ price: 199, originalPrice: 249 }).isOnSale()).toBe(true);
    expect(buildProduct({ price: 199, originalPrice: 199 }).isOnSale()).toBe(false);
    expect(buildProduct({ price: 199, originalPrice: 150 }).isOnSale()).toBe(false);
    expect(buildProduct({ price: 199 }).isOnSale()).toBe(false);
  });

  it('computes savings and discount percentage', () => {
    const onSale = buildProduct({ price: 199, originalPrice: 249 });
    expect(onSale.savings()?.minor).toBe(5000);
    expect(onSale.discountPercentage()).toBe(20);

    const fullPrice = buildProduct({ price: 199 });
    expect(fullPrice.savings()).toBeNull();
    expect(fullPrice.discountPercentage()).toBe(0);

    expect(buildProduct({ price: 299, originalPrice: 399 }).discountPercentage()).toBe(25);
  });

  it('reports featured status', () => {
    expect(buildProduct({ featured: true }).isFeatured()).toBe(true);
    expect(buildProduct().isFeatured()).toBe(false);
  });

  it('copies the images array so callers cannot mutate the product', () => {
    const images = [{ url: '/a.png', alt: 'A' }];
    const product = buildProduct({ images });
    images.push({ url: '/b.png', alt: 'B' });
    expect(product.images).toHaveLength(1);
  });

  it('keeps money values as provided', () => {
    const product = buildProduct({ price: 49.95 });
    expect(product.price.equals(Money.fromMinor(4995, 'EUR'))).toBe(true);
  });

  describe('variants', () => {
    const kit = () =>
      buildProduct({
        id: 'kit-72h',
        name: 'Kit 72h',
        variants: [
          { id: 'kit-72h-1', title: '1 persona', price: 119 },
          { id: 'kit-72h-2', title: '2 personas', price: 199 },
          { id: 'kit-72h-4', title: '4 personas', price: 359, inStock: false },
        ],
      });

    it('gives a plain product one implicit variant and no variant title', () => {
      const product = buildProduct({ id: 'silbato', price: 5 });
      expect(product.variants).toHaveLength(1);
      expect(product.selectedVariant().id.value).toBe('silbato');
      expect(product.hasVariants()).toBe(false);
      expect(product.variantTitle).toBeNull();
      expect(product.displayName).toBe(product.name);
      expect(product.hasPriceRange()).toBe(false);
    });

    it('selects the first in-stock variant and describes it at the top level', () => {
      const product = kit();
      expect(product.id.value).toBe('kit-72h-1');
      expect(product.price.minor).toBe(11900);
      expect(product.variantTitle).toBe('1 persona');
      expect(product.displayName).toBe('Kit 72h · 1 persona');
    });

    it('skips out-of-stock variants when selecting the default', () => {
      const product = buildProduct({
        variants: [
          { id: 'a', title: 'A', price: 10, inStock: false },
          { id: 'b', title: 'B', price: 20 },
        ],
      });
      expect(product.id.value).toBe('b');
    });

    it('switches variant with withVariant and keeps the rest of the product', () => {
      const two = kit().withVariant('kit-72h-2');
      expect(two.id.value).toBe('kit-72h-2');
      expect(two.price.minor).toBe(19900);
      expect(two.slug).toBe('kit-72h');
      expect(two.variants).toHaveLength(3);
      const four = two.withVariant('kit-72h-4');
      expect(four.inStock).toBe(false);
      expect(() => two.withVariant('nope')).toThrow(NotFoundError);
    });

    it('reports the price range across variants', () => {
      const { min, max } = kit().priceRange();
      expect(min.minor).toBe(11900);
      expect(max.minor).toBe(35900);
      expect(kit().hasPriceRange()).toBe(true);
    });

    it('lets top-level values override the selected variant', () => {
      const base = kit();
      const discounted = Product.create({ ...base, originalPrice: Money.fromMajor(150, 'EUR') });
      expect(discounted.selectedVariant().originalPrice?.minor).toBe(15000);
      expect(discounted.variants[1].originalPrice).toBeNull();
    });

    it('rejects duplicate ids, mixed currencies and an unknown selected id', () => {
      const base = kit();
      const [first, second] = base.variants;
      expect(() => Product.create({ ...base, variants: [first, { ...second, id: first.id }] })).toThrow(ValidationError);
      expect(() =>
        Product.create({ ...base, variants: [first, { ...second, price: Money.fromMajor(1, 'USD') }] }),
      ).toThrow(ValidationError);
      expect(() => Product.create({ ...base, id: new ProductId('other') })).toThrow(ValidationError);
    });

    it('is a kit only when details carry kit info', () => {
      expect(buildProduct().isKit()).toBe(false);
      const details = { features: [], specifications: [], contents: [], kit: { label: '72H' } };
      expect(buildProduct({ details }).isKit()).toBe(true);
    });
  });
});
