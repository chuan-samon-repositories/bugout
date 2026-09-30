import type { ActionCardDeck } from '@/domain/entities';
import type { SourceId } from './sources';

/** Categories of the "Tarjetas de acción" deck, in deck order (the letter code is the upper-case id). */
export type CategoryId = 'pm' | 'cl' | 'ev' | 'na' | 'te' | 'pa' | 'ad';

/** Printed code of a card, e.g. "PA-04": its category's letters and a two-digit number. */
export type CardCode = `${Uppercase<CategoryId>}-${number}${number}`;

/** Corner shape of a category: with the letters, it makes the colour code readable without colour. */
export type CategoryShape = 'circle' | 'square' | 'arrow' | 'diamond' | 'pentagon' | 'cross' | 'star';

export interface CardCategory {
  id: CategoryId;
  /** Name as printed on the deck, e.g. "Primeros auxilios". */
  name: string;
  /** One line under the category name: which situations it covers. */
  description: string;
  shape: CategoryShape;
  /** Id of the category's group on the Prepárate page (`/preparate#<anchor>`). */
  anchor: string;
}

/** A step of a card. `see` points to the cards to follow next (never typed into the text). */
export interface CardStep {
  text: string;
  see?: readonly CardCode[];
}

export interface CardQuestion {
  question: string;
  answer: string;
}

export type SourceLanguage = 'es' | 'ca' | 'en';

/** An official page backing a card's advice. */
export interface Source {
  organisation: string;
  title: string;
  url: string;
  /** Language of the page; the UI says so when it is not Spanish. */
  language: SourceLanguage;
}

/** Which deck a kit carries (`details.kit.actionCards`): the essential subset or every main card. */
export type DeckEdition = ActionCardDeck;

export interface ActionCard {
  code: CardCode;
  /** Page slug under `/preparate/`. */
  slug: string;
  category: CategoryId;
  title: string;
  /** Search title of its page, at most 51 characters so that it fits Google's results with " · Bugout". */
  metaTitle: string;
  /** One sentence: when to use the card. The page's subtitle and its line in the index. */
  summary: string;
  /** Search description (meta description), 110–160 characters: the key steps, so the result answers the query. */
  description: string;
  /** What to do, in order (3–6 steps). Empty only for the fill-in card, which has `fields`. */
  steps: readonly CardStep[];
  /** "No hagas": common mistakes. */
  dont: readonly string[];
  /** "Llama al 112 si…": when to call. */
  call112?: string;
  /** Short background ("Por qué"), from the back of the printed card. */
  context?: readonly string[];
  /** What to write down (the fill-in family sheet only). */
  fields?: readonly string[];
  /** Questions people search for, answered from the card's own sources (shown as "Preguntas frecuentes"). */
  faq?: readonly CardQuestion[];
  /** Catalog categories (`agua`, `luz-y-energia`…) whose products help in this situation ("Material útil"). */
  productCategories?: readonly string[];
  /** Ids in `sources.ts`, most relevant first. */
  sources: readonly SourceId[];
  /** Part of the essential deck (Kit 24h). Every main card is in the complete deck. */
  essential: boolean;
  /** Extra card: online guide only, in no kit's deck. */
  extra?: true;
}
