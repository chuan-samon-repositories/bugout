import { describe, expect, it } from 'vitest';
import { getContainer } from '@/infrastructure/config';
import { cardByCode } from './deck';
import { CHECKLIST_SOURCES, drinkingWaterLitres, KIT_CHECKLIST } from './kitChecklist';
import { SOURCES } from './sources';

describe('the emergency kit checklist', () => {
  const items = KIT_CHECKLIST.flatMap((group) => group.items);

  it('has unique groups and lines, each written as a finished line', () => {
    expect(new Set(KIT_CHECKLIST.map((group) => group.id)).size).toBe(KIT_CHECKLIST.length);
    for (const group of KIT_CHECKLIST) {
      expect(new Set(group.items.map((item) => item.label)).size, group.id).toBe(group.items.length);
      for (const item of group.items) {
        expect(item.label).not.toMatch(/\.$/);
        if (item.note) expect(item.note).toMatch(/\.$/);
      }
    }
  });

  it('only points to cards that exist', () => {
    for (const code of items.flatMap((item) => item.cards ?? [])) expect(cardByCode(code), code).not.toBeNull();
  });

  it('links products that exist in the local catalog', async () => {
    const slugs = new Set((await getContainer().getGetProductsUseCase().execute()).map((product) => product.slug));
    for (const slug of items.flatMap((item) => item.productSlugs ?? [])) expect(slugs, slug).toContain(slug);
  });

  it('cites official sources that exist', () => {
    expect(CHECKLIST_SOURCES.length).toBeGreaterThan(0);
    for (const id of CHECKLIST_SOURCES) expect(SOURCES[id]).toBeDefined();
  });

  it('works out the drinking water for 72 hours: 2 litres per person and day', () => {
    expect([1, 2, 4].map(drinkingWaterLitres)).toEqual([6, 12, 24]);
  });
});
