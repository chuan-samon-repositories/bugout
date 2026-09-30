import { describe, expect, it } from 'vitest';
import type { KitInfo } from '@/domain/entities';
import { buildProduct } from '@/domain/testing/buildProduct';
import { ACTION_CARDS } from './cards';
import { CARD_CATEGORIES } from './categories';
import {
  cardByCode,
  cardBySlug,
  cardsByCategory,
  citedOrganisations,
  CONTENT_REVIEW,
  deckCards,
  helpfulProducts,
  kitDecks,
  kitsWithCard,
  relatedCards,
} from './deck';
import { messages } from '@/presentation/i18n';
import { SOURCES, type SourceId } from './sources';

/** The Kit 24h deck, as the printed deck's catalogue defines it. */
const ESSENTIAL_CODES = [
  'PM-00', 'PM-01', 'PM-02', 'PM-03',
  'CL-01', 'CL-02', 'CL-03', 'CL-08', 'CL-09', 'CL-10',
  'EV-01', 'EV-02', 'EV-03',
  'NA-01', 'NA-02', 'NA-03', 'NA-06',
  'TE-01', 'TE-02', 'TE-03', 'TE-04',
  'PA-01', 'PA-02', 'PA-03', 'PA-04', 'PA-05', 'PA-07', 'PA-10', 'PA-11',
];

const codes = ACTION_CARDS.map((card) => card.code);

describe('the action-card deck', () => {
  it('has unique codes and slugs', () => {
    expect(new Set(codes).size).toBe(codes.length);
    const slugs = ACTION_CARDS.map((card) => card.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('numbers each category from its first card without gaps, in deck order', () => {
    for (const { category, cards } of cardsByCategory()) {
      const first = category.id === 'pm' ? 0 : 1;
      expect(cards.map((card) => card.code)).toEqual(
        cards.map((_, index) => `${category.id.toUpperCase()}-${String(first + index).padStart(2, '0')}`),
      );
    }
    const order = CARD_CATEGORIES.map((category) => category.id);
    const categoryIndexes = ACTION_CARDS.map((card) => order.indexOf(card.category));
    expect(categoryIndexes).toEqual([...categoryIndexes].sort((a, b) => a - b));
  });

  it('uses URL-safe slugs that never look like a card code', () => {
    for (const card of ACTION_CARDS) {
      expect(card.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(cardByCode(card.slug)).toBeNull();
    }
  });

  it('gives every action card 3 to 6 steps, and the fill-in family sheet its fields instead', () => {
    for (const card of ACTION_CARDS) {
      if (card.fields) {
        expect(card.code).toBe('CL-10');
        expect(card.steps).toHaveLength(0);
        expect(card.fields.length).toBeGreaterThan(0);
      } else {
        expect(card.steps.length, card.code).toBeGreaterThanOrEqual(3);
        expect(card.steps.length, card.code).toBeLessThanOrEqual(6);
      }
      expect(card.dont.length, card.code).toBeGreaterThan(0);
    }
  });

  it('writes its copy as finished sentences, without internal notes or typed-in card codes', () => {
    for (const card of ACTION_CARDS) {
      const texts = [
        card.title,
        card.summary,
        card.metaTitle,
        card.description,
        ...card.steps.map((step) => step.text),
        ...card.dont,
        ...(card.context ?? []),
        ...(card.fields ?? []),
        card.call112 ?? '',
      ];
      for (const text of texts) {
        expect(text, card.code).not.toMatch(/TODO|Pendiente:|\bvalidar\b/);
        expect(text, card.code).not.toMatch(/\b[A-Z]{2}-\d{2}\b/);
      }
      for (const text of [card.summary, ...card.steps.map((step) => step.text), ...card.dont, ...(card.context ?? [])]) {
        expect(text, card.code).toMatch(/[.?!»)]$/);
      }
      expect(card.call112 ?? 'ok.', card.code).toMatch(/^[a-zá-ú0-9].*\.$/);
    }
  });

  it('gives every card a search title that fits the results page and a full search description', () => {
    for (const card of ACTION_CARDS) {
      expect(card.metaTitle.length, card.code).toBeLessThanOrEqual(51);
      expect(card.description.length, card.code).toBeGreaterThanOrEqual(110);
      expect(card.description.length, card.code).toBeLessThanOrEqual(160);
      expect(card.description, card.code).toMatch(/\.$/);
    }
    const descriptions = ACTION_CARDS.map((card) => card.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('writes its questions as questions and answers them in full sentences, never repeating one', () => {
    const questions = ACTION_CARDS.flatMap((card) => card.faq ?? []);
    expect(questions.length).toBeGreaterThan(0);
    for (const { question, answer } of questions) {
      expect(question).toMatch(/^¿.+\?$/);
      expect(answer).toMatch(/\.$/);
      expect(answer).not.toMatch(/\b[A-Z]{2}-\d{2}\b/);
    }
    expect(new Set(questions.map((item) => item.question)).size).toBe(questions.length);
  });

  it('links products only through real catalog categories', () => {
    const categories = Object.keys(messages.catalog.categories);
    for (const card of ACTION_CARDS) {
      for (const category of card.productCategories ?? []) expect(categories, card.code).toContain(category);
    }
  });

  it('only points to cards that exist, and never to itself', () => {
    for (const card of ACTION_CARDS) {
      for (const code of card.steps.flatMap((step) => step.see ?? [])) {
        expect(codes, card.code).toContain(code);
        expect(code).not.toBe(card.code);
      }
    }
  });

  it('backs every card with at least one official source and lists no unused source', () => {
    const used = new Set<SourceId>();
    for (const card of ACTION_CARDS) {
      expect(card.sources.length, card.code).toBeGreaterThan(0);
      expect(new Set(card.sources).size, card.code).toBe(card.sources.length);
      card.sources.forEach((id) => used.add(id));
    }
    expect([...used].sort()).toEqual(Object.keys(SOURCES).sort());
    for (const source of Object.values(SOURCES)) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.organisation.trim()).not.toBe('');
      expect(source.title.trim()).not.toBe('');
    }
  });

  it('puts exactly the Kit 24h cards in the essential deck and every main card in the complete deck', () => {
    expect(deckCards('essential').map((card) => card.code)).toEqual(ESSENTIAL_CODES);
    const main = ACTION_CARDS.filter((card) => card.category !== 'ad');
    expect(deckCards('complete')).toEqual(main);
  });

  it('keeps the extras out of every deck and in their own category', () => {
    const extras = ACTION_CARDS.filter((card) => card.extra);
    expect(extras.map((card) => card.category)).toEqual(extras.map(() => 'ad'));
    expect(ACTION_CARDS.filter((card) => card.category === 'ad')).toEqual(extras);
    expect(extras.some((card) => card.essential)).toBe(false);
  });

  it('never claims a medical review that has not happened', () => {
    expect(CONTENT_REVIEW.reviewer).toBeNull();
    expect(CONTENT_REVIEW.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('deck helpers', () => {
  it('finds cards by slug and by code in any case', () => {
    expect(cardBySlug('hemorragia-grave')?.code).toBe('PA-04');
    expect(cardByCode('pa-04')?.slug).toBe('hemorragia-grave');
    expect(cardByCode('PA-99')).toBeNull();
    expect(cardBySlug('nope')).toBeNull();
  });

  it('relates a card to the cards its steps point to first, then to its category', () => {
    const card = cardByCode('PM-01')!;
    const related = relatedCards(card).map((candidate) => candidate.code);
    expect(related.slice(0, 4)).toEqual(['PM-03', 'CL-02', 'PM-02', 'CL-03']);
    expect(relatedCards(cardByCode('NA-07')!).map((candidate) => candidate.category)).toEqual(['na', 'na', 'na', 'na']);
    expect(relatedCards(card)).not.toContain(card);
  });

  it('suggests in-stock products of the card\'s categories first, never the build-your-own kit, up to the limit', () => {
    const product = (id: string, category: string, inStock = true) => buildProduct({ id, category, inStock });
    const custom = buildProduct({
      id: 'kit-custom',
      category: 'kits',
      details: { features: [], specifications: [], contents: [], kit: { label: 'CUSTOM', buildYourOwn: true } },
    });
    const catalog = [product('frontal', 'luz-y-energia', false), product('radio', 'luz-y-energia'), product('agua', 'agua'), custom];
    const light = cardByCode('CL-08')!;
    expect(helpfulProducts(light, catalog).map((item) => item.slug)).toEqual(['radio', 'frontal']);
    expect(helpfulProducts(light, catalog, 1).map((item) => item.slug)).toEqual(['radio']);
    expect(helpfulProducts(cardByCode('PM-01')!, catalog)).toEqual([]);
    expect(helpfulProducts(cardByCode('CL-01')!, catalog)).toEqual([]);
  });

  it('lists each cited organisation once', () => {
    const organisations = citedOrganisations();
    expect(new Set(organisations).size).toBe(organisations.length);
    expect(organisations).toContain('Cruz Roja Española');
    expect(organisations).toContain('European Resuscitation Council (ERC)');
  });

  it('reads which kits carry a deck from the catalog, never from the kit name', () => {
    const kit = (id: string, name: string, info: KitInfo) =>
      buildProduct({ id, name, details: { features: [], specifications: [], contents: [], kit: info } });
    const kit24 = kit('kit-24h', 'Kit 24h', { label: '24H', actionCards: 'essential' });
    const kit72 = kit('kit-72h', 'Kit 72h', { label: '72H', actionCards: 'complete' });
    const custom = kit('kit-custom', 'Kit Custom', { label: 'CUSTOM', buildYourOwn: true });
    const loose = buildProduct({ id: 'linterna' });
    const decks = kitDecks([kit24, custom, kit72, loose]);
    expect(decks).toEqual([
      { slug: 'kit-24h', name: 'Kit 24h', edition: 'essential', cardCount: ESSENTIAL_CODES.length },
      { slug: 'kit-72h', name: 'Kit 72h', edition: 'complete', cardCount: deckCards('complete').length },
    ]);
    expect(kitsWithCard(cardByCode('PA-04')!, decks).map((kit) => kit.slug)).toEqual(['kit-24h', 'kit-72h']);
    expect(kitsWithCard(cardByCode('PA-06')!, decks).map((kit) => kit.slug)).toEqual(['kit-72h']);
    expect(kitsWithCard(cardByCode('AD-02')!, decks)).toEqual([]);
  });
});
