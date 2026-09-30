import type { Product } from '@/domain/entities';
import { ACTION_CARDS } from './cards';
import { CARD_CATEGORIES } from './categories';
import { SOURCES, type SourceId } from './sources';
import type { ActionCard, CardCategory, CardCode, DeckEdition, Source } from './types';

/**
 * When the cards' content was last checked against their sources, and who reviewed it medically. The
 * reviewer stays null (and the site says nothing about a review) until a registered healthcare
 * professional has really signed it off.
 */
export const CONTENT_REVIEW: { publishedAt: string; updatedAt: string; reviewer: string | null } = {
  /** When the cards were first published (never changes). */
  publishedAt: '2026-09-30',
  updatedAt: '2026-09-30',
  reviewer: null,
};

export function cardBySlug(slug: string): ActionCard | null {
  return ACTION_CARDS.find((card) => card.slug === slug) ?? null;
}

/** Looks a card up by its printed code, in any case ("PA-04", "pa-04"): the QR codes use it. */
export function cardByCode(code: string): ActionCard | null {
  const wanted = code.toUpperCase();
  return ACTION_CARDS.find((card) => card.code === wanted) ?? null;
}

function requireCard(code: CardCode): ActionCard {
  const card = cardByCode(code);
  if (!card) throw new Error(`Unknown action card: ${code}`);
  return card;
}

export function cardsByCategory(): { category: CardCategory; cards: ActionCard[] }[] {
  return CARD_CATEGORIES.map((category) => ({
    category,
    cards: ACTION_CARDS.filter((card) => card.category === category.id),
  }));
}

/** The cards a deck edition holds: the essential subset (Kit 24h) or every main card (Kit 72h). Never the extras. */
export function deckCards(edition: DeckEdition): ActionCard[] {
  return ACTION_CARDS.filter((card) => isInDeck(card, edition));
}

export function isInDeck(card: ActionCard, edition: DeckEdition): boolean {
  return !card.extra && (edition === 'complete' || card.essential);
}

/** The cards a card's steps point to, in order and without repeats. */
export function referencedCards(card: ActionCard): ActionCard[] {
  const codes = new Set(card.steps.flatMap((step) => step.see ?? []));
  return [...codes].map(requireCard);
}

/**
 * "Ver también": the cards its steps point to, then the rest of its category, up to `limit`.
 */
export function relatedCards(card: ActionCard, limit = 4): ActionCard[] {
  const related = referencedCards(card).filter((candidate) => candidate.code !== card.code);
  for (const candidate of ACTION_CARDS) {
    if (related.length >= limit) break;
    if (candidate.category === card.category && candidate.code !== card.code && !related.includes(candidate)) {
      related.push(candidate);
    }
  }
  return related.slice(0, limit);
}

export function cardSources(card: ActionCard): Source[] {
  return card.sources.map((id) => SOURCES[id]);
}

/** Every organisation the cards cite, once each, in alphabetical order. */
export function citedOrganisations(): string[] {
  const ids = new Set<SourceId>(ACTION_CARDS.flatMap((card) => card.sources));
  return [...new Set([...ids].map((id) => SOURCES[id].organisation))].sort((a, b) => a.localeCompare(b, 'es'));
}

export interface KitDeck {
  slug: string;
  name: string;
  edition: DeckEdition;
  cardCount: number;
}

/**
 * The kits that carry a deck, from the catalog (`details.kit.actionCards`), in catalog order. The site
 * says a kit includes the cards only through this, so it never claims more than the catalog does.
 */
export function kitDecks(products: readonly Product[]): KitDeck[] {
  return products.flatMap((product) => {
    const edition = product.details?.kit?.actionCards;
    if (!edition) return [];
    return [{ slug: product.slug, name: product.name, edition, cardCount: deckCards(edition).length }];
  });
}

/**
 * "Material útil": catalog products in the card's `productCategories`, in stock first, in catalog order, up to
 * `limit`. The build-your-own kit is left out (it is a builder, not something to take along).
 */
export function helpfulProducts(card: ActionCard, products: readonly Product[], limit = 4): Product[] {
  const categories = new Set(card.productCategories ?? []);
  const matching = products.filter((product) => categories.has(product.category) && !product.isBuildYourOwn());
  return [...matching.filter((product) => product.inStock), ...matching.filter((product) => !product.inStock)].slice(0, limit);
}

/** The kits whose deck holds this card. */
export function kitsWithCard(card: ActionCard, kits: readonly KitDeck[]): KitDeck[] {
  return kits.filter((kit) => isInDeck(card, kit.edition));
}
