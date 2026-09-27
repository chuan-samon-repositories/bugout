import { describe, expect, it } from 'vitest';
import { isPeopleOption, peopleCount, peopleOption, variantOptionLabel } from './variants';

const variant = (options: Array<{ name: string; value: string }>, title = '') => ({ options, title });

describe('variant helpers', () => {
  it('recognises the "Personas" option whatever its case, accents or spacing', () => {
    expect(['Personas', 'personas', ' PERSONAS ', 'Persona', 'Pérsonas'].map((name) => isPeopleOption({ name }))).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(isPeopleOption({ name: 'Tamaño' })).toBe(false);
    expect(peopleOption(variant([{ name: 'Color', value: 'Rojo' }, { name: 'Personas', value: '2' }]))).toEqual({
      name: 'Personas',
      value: '2',
    });
    expect(peopleOption(variant([]))).toBeNull();
  });

  it('reads the number of people from bare values and from "N personas" values', () => {
    expect(peopleCount('2')).toBe(2);
    expect(peopleCount('2 personas')).toBe(2);
    expect(peopleCount(' 1 persona')).toBe(1);
    expect(peopleCount('4')).toBe(4);
    expect(peopleCount('Familia')).toBeNull();
    expect(peopleCount('0')).toBeNull();
    expect(peopleCount('')).toBeNull();
    expect(peopleCount(variant([{ name: 'Personas', value: '2' }]))).toBe(2);
    expect(peopleCount(variant([{ name: 'personas', value: '4 personas' }]))).toBe(4);
    // Only the people option counts: "30L" is a size, not a number of people.
    expect(peopleCount(variant([{ name: 'Tamaño', value: '30L' }]))).toBeNull();
  });

  it('labels a variant with its people count, else its first option value, else its title', () => {
    expect(variantOptionLabel(variant([{ name: 'Personas', value: '2' }], '2 personas'))).toBe('2');
    expect(variantOptionLabel(variant([{ name: 'Personas', value: '2 personas' }], '2 personas'))).toBe('2');
    expect(variantOptionLabel(variant([{ name: 'Tamaño', value: '30L' }], '30L'))).toBe('30L');
    expect(variantOptionLabel(variant([], 'Único'))).toBe('Único');
  });
});
