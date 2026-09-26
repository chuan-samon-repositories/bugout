import { describe, expect, it } from 'vitest';
import { SHIPPABLE_PROVINCES, provinceForPostalCode } from './provinces';
import { NON_SHIPPABLE_POSTAL_PREFIXES } from './validateCheckoutDetails';

describe('SHIPPABLE_PROVINCES', () => {
  it('lists 48 provinces, each with exactly one distinct two-digit prefix', () => {
    expect(SHIPPABLE_PROVINCES).toHaveLength(48);
    expect(new Set(SHIPPABLE_PROVINCES.map((province) => province.name)).size).toBe(48);
    expect(new Set(SHIPPABLE_PROVINCES.map((province) => province.postalPrefix)).size).toBe(48);
    for (const { postalPrefix } of SHIPPABLE_PROVINCES) expect(postalPrefix).toMatch(/^\d{2}$/);
  });

  it('covers every INE code from 01 to 50 except the Canary Islands', () => {
    const expected = Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2, '0')).filter(
      (prefix) => !NON_SHIPPABLE_POSTAL_PREFIXES.includes(prefix),
    );
    expect(SHIPPABLE_PROVINCES.map((province) => province.postalPrefix).sort()).toEqual(expected);
  });

  it('is in Spanish alphabetical order', () => {
    const names = SHIPPABLE_PROVINCES.map((province) => province.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es')));
  });
});

describe('provinceForPostalCode', () => {
  it('maps a postal code to its province', () => {
    expect(provinceForPostalCode('08001')).toBe('Barcelona');
    expect(provinceForPostalCode('28013')).toBe('Madrid');
    expect(provinceForPostalCode('07001')).toBe('Illes Balears');
    expect(provinceForPostalCode('01001')).toBe('Álava');
    expect(provinceForPostalCode('50006')).toBe('Zaragoza');
    expect(provinceForPostalCode(' 48001 ')).toBe('Bizkaia');
  });

  it('returns null for non-shippable or malformed codes', () => {
    for (const code of ['35001', '38001', '51001', '52001', '00123', '53001', '0800', '080011', 'ABCDE', '']) {
      expect(provinceForPostalCode(code)).toBeNull();
    }
  });
});
