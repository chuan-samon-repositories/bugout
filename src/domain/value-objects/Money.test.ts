import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { Money, discountPercentage } from './Money';
import { ValidationError } from '@/domain/errors';

describe('Money', () => {
  it('stores integer minor units', () => {
    const money = Money.fromMinor(1999, 'EUR');
    expect(money.minor).toBe(1999);
    expect(money.amount).toBe(19.99);
    expect(money.currency).toBe('EUR');
  });

  it('adds exactly where floating point would drift', () => {
    const sum = Money.fromMajor(0.1, 'EUR').add(Money.fromMajor(0.2, 'EUR'));
    expect(sum.minor).toBe(30);
    expect(sum.equals(Money.fromMajor(0.3, 'EUR'))).toBe(true);
  });

  it('keeps sums of cents exact for any list of amounts', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 1_000_000 }), { maxLength: 50 }), (cents) => {
        const total = cents.reduce((acc, c) => acc.add(Money.fromMinor(c, 'EUR')), Money.zero('EUR'));
        expect(total.minor).toBe(cents.reduce((a, b) => a + b, 0));
      }),
    );
  });

  it('rounds major amounts to the nearest cent', () => {
    expect(Money.fromMajor(19.99, 'EUR').minor).toBe(1999);
    expect(Money.fromMajor('19.99', 'EUR').minor).toBe(1999);
    expect(Money.fromMajor(10.004, 'EUR').minor).toBe(1000);
    expect(Money.fromMajor(10.006, 'EUR').minor).toBe(1001);
    expect(Money.fromMajor('249.0', 'USD').minor).toBe(24900);
  });

  it('rejects invalid major amounts', () => {
    for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, 'abc', '', '  ', -1]) {
      expect(() => Money.fromMajor(amount, 'EUR')).toThrow(ValidationError);
    }
  });

  it('rejects negative or fractional minor units', () => {
    expect(() => Money.fromMinor(-1, 'EUR')).toThrow(ValidationError);
    expect(() => Money.fromMinor(1.5, 'EUR')).toThrow(ValidationError);
  });

  it('rejects invalid currency codes', () => {
    for (const code of ['', 'eur', 'EU', 'EURO', '€', '12A']) {
      expect(() => Money.fromMinor(100, code)).toThrow(ValidationError);
    }
  });

  it('refuses to combine different currencies', () => {
    const eur = Money.fromMinor(100, 'EUR');
    const usd = Money.fromMinor(100, 'USD');
    expect(() => eur.add(usd)).toThrow(/Currency mismatch/);
    expect(() => eur.subtract(usd)).toThrow(ValidationError);
    expect(() => eur.greaterThan(usd)).toThrow(ValidationError);
    expect(() => eur.greaterThanOrEqual(usd)).toThrow(ValidationError);
    expect(eur.equals(usd)).toBe(false);
  });

  it('clamps subtraction at zero', () => {
    expect(Money.fromMinor(100, 'EUR').subtract(Money.fromMinor(250, 'EUR')).isZero()).toBe(true);
    expect(Money.fromMinor(250, 'EUR').subtract(Money.fromMinor(100, 'EUR')).minor).toBe(150);
  });

  it('multiplies and rounds to whole cents', () => {
    expect(Money.fromMinor(1999, 'EUR').multiply(3).minor).toBe(5997);
    expect(Money.fromMinor(1000, 'EUR').multiply(1 / 3).minor).toBe(333);
    expect(() => Money.fromMinor(100, 'EUR').multiply(-1)).toThrow(ValidationError);
    expect(() => Money.fromMinor(100, 'EUR').multiply(Number.NaN)).toThrow(ValidationError);
  });

  it('compares amounts', () => {
    const small = Money.fromMinor(100, 'EUR');
    const big = Money.fromMinor(200, 'EUR');
    expect(big.greaterThan(small)).toBe(true);
    expect(small.greaterThan(big)).toBe(false);
    expect(small.greaterThanOrEqual(Money.fromMinor(100, 'EUR'))).toBe(true);
    expect(Money.zero('EUR').isZero()).toBe(true);
  });
});

describe('discountPercentage', () => {
  const eur = (major: number) => Money.fromMajor(major, 'EUR');

  it('returns the whole-number percentage saved', () => {
    expect(discountPercentage(eur(199), eur(249))).toBe(20);
    expect(discountPercentage(eur(299), eur(399))).toBe(25);
    expect(discountPercentage(eur(10), eur(30))).toBe(67);
  });

  it('is 0 when the original price is not higher or uses another currency', () => {
    expect(discountPercentage(eur(199), eur(199))).toBe(0);
    expect(discountPercentage(eur(199), eur(150))).toBe(0);
    expect(discountPercentage(eur(199), Money.fromMajor(249, 'USD'))).toBe(0);
  });

  it('always returns an integer between 0 and 100', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000_000 }), fc.integer({ min: 1, max: 10_000_000 }), (price, original) => {
        const percent = discountPercentage(Money.fromMinor(price, 'EUR'), Money.fromMinor(original, 'EUR'));
        return Number.isInteger(percent) && percent >= 0 && percent <= 100;
      }),
    );
  });
});
