import { KIT_CARD_IMAGES } from "./kitCardPhotos.generated";
import type { KitCardImage } from "./photoRelief";

/** The photo a kit card shows instead of its gradient header, and how tall it is drawn. */
export interface KitCardPhoto {
  image: KitCardImage;
  /**
   * Height of the photo on the card, in pixels. Its bottom sits in the card header, so anything above
   * `KIT_PHOTO_BASE` sticks out above the card. Sized so each backpack looks as big as it is next to the other.
   */
  height: number;
}

/** Pixels from the top of the card to the bottom of its photo (the header is 160 px, the photo sits 12 px up). */
export const KIT_PHOTO_BASE = 148;

/**
 * Kits whose card shows the backpack they come in, keyed by kit slug (the Shopify handle, see
 * docs/SHOPIFY_SETUP.md). The Kit 72h's 65 L backpack is drawn about 1.3 times as tall as the Kit 24h's 30 L one
 * (the cube root of 65/30), counting the body only: the 30 L photo also shows its shoulder straps above the bag.
 */
const KIT_CARD_PHOTOS: ReadonlyMap<string, KitCardPhoto> = new Map([
  ["kit-24h", { image: KIT_CARD_IMAGES["kit-24h"], height: 232 }],
  ["kit-72h", { image: KIT_CARD_IMAGES["kit-72h"], height: 266 }],
]);

export function kitCardPhoto(slug: string): KitCardPhoto | null {
  return KIT_CARD_PHOTOS.get(slug) ?? null;
}

/** How far the tallest of these kits' photos sticks out above its card, in pixels (0 when none does). */
export function kitPhotoRise(slugs: readonly string[]): number {
  return Math.max(0, ...slugs.map((slug) => (kitCardPhoto(slug)?.height ?? 0) - KIT_PHOTO_BASE));
}
