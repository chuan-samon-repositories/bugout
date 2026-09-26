import { describe, expect, it } from 'vitest';
import { Product } from './Product';
import { buildProduct } from '../../testing/buildProduct';
import { Money } from '../../value-objects/Money';
import { ValidationError } from '../../errors';

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
});
