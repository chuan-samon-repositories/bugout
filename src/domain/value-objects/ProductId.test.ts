import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { ProductId } from './ProductId';
import { ValidationError } from '@/domain/errors';

describe('ProductId', () => {
  it('rejects empty and whitespace-only strings', () => {
    expect(() => new ProductId('')).toThrow(ValidationError);
    fc.assert(
      fc.property(fc.stringMatching(/^\s+$/), (blank) => {
        expect(() => new ProductId(blank)).toThrow(ValidationError);
      }),
    );
  });

  it('accepts any non-blank string, including Shopify GIDs', () => {
    expect(new ProductId('gid://shopify/ProductVariant/1').value).toBe('gid://shopify/ProductVariant/1');
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (value) => {
          expect(new ProductId(value).value).toBe(value);
        },
      ),
    );
  });

  it('compares by value', () => {
    expect(new ProductId('a').equals(new ProductId('a'))).toBe(true);
    expect(new ProductId('a').equals(new ProductId('b'))).toBe(false);
  });
});
