import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { Quantity } from './Quantity';
import { ValidationError } from '@/domain/errors';

describe('Quantity', () => {
  it('accepts positive integers', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (value) => {
        expect(new Quantity(value).value).toBe(value);
      }),
    );
  });

  it('rejects zero and negative values', () => {
    fc.assert(
      fc.property(fc.integer({ max: 0 }), (value) => {
        expect(() => new Quantity(value)).toThrow(ValidationError);
      }),
    );
  });

  it('rejects fractions, NaN and infinity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, noNaN: true }).filter((n) => !Number.isInteger(n)),
        (value) => {
          expect(() => new Quantity(value)).toThrow(ValidationError);
        },
      ),
    );
    expect(() => new Quantity(Number.NaN)).toThrow(ValidationError);
    expect(() => new Quantity(Number.POSITIVE_INFINITY)).toThrow(ValidationError);
  });
});
