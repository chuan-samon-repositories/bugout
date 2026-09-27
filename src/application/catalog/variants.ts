import type { ProductVariant, ProductVariantOption } from '@/domain/entities/product/Product';

/** Lower case without accents or surrounding spaces, for comparing option names. */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/** True for the "number of people" option of a kit ("Personas", "persona", "PERSONAS"…). */
export function isPeopleOption(option: Pick<ProductVariantOption, 'name'>): boolean {
  const name = normalizeName(option.name);
  return name === 'personas' || name === 'persona';
}

/** The variant's "Personas" option, if it has one. */
export function peopleOption(variant: Pick<ProductVariant, 'options'>): ProductVariantOption | null {
  return variant.options.find(isPeopleOption) ?? null;
}

/**
 * Number of people of a "Personas" option value or of a variant: the leading positive
 * integer, so "2" (Shopify, local catalog) and "2 personas" both give 2. Null when the
 * value does not start with one, or when the variant has no "Personas" option.
 */
export function peopleCount(input: string | Pick<ProductVariant, 'options'>): number | null {
  const value = typeof input === 'string' ? input : peopleOption(input)?.value;
  const match = value?.match(/^\s*(\d+)/);
  if (!match) return null;
  const count = Number(match[1]);
  return Number.isSafeInteger(count) && count > 0 ? count : null;
}

/**
 * Short label of a variant for compact lists such as "1, 2 o 4": the number of people
 * when the variant has a "Personas" option (whether its value is "2" or "2 personas"),
 * otherwise its first option value, otherwise its title.
 */
export function variantOptionLabel(variant: Pick<ProductVariant, 'options' | 'title'>): string {
  const count = peopleCount(variant);
  if (count !== null) return String(count);
  return variant.options[0]?.value ?? variant.title;
}
