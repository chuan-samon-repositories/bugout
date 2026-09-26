import { describe, expect, it } from 'vitest';
import { isBlank, isValidEmail } from './validation';

describe('isValidEmail', () => {
  it('accepts common addresses', () => {
    for (const email of ['ana@example.es', 'ana.garcia+pedidos@correo.example.com', ' ana@example.es ']) {
      expect(isValidEmail(email)).toBe(true);
    }
  });

  it('rejects malformed addresses', () => {
    for (const email of ['', 'ana', 'ana@', '@example.es', 'ana@example', 'ana@@example.es', 'ana @example.es', 'ana@example..es', 'ana@example.e']) {
      expect(isValidEmail(email)).toBe(false);
    }
  });
});

describe('isBlank', () => {
  it('treats empty, whitespace, null and undefined as blank', () => {
    expect(isBlank('')).toBe(true);
    expect(isBlank(' \t')).toBe(true);
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank(' a ')).toBe(false);
  });
});
