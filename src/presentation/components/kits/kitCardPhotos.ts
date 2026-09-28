import type { CSSProperties } from "react";
import { KIT_CARD_IMAGES } from "./kitCardPhotos.generated";
import type { KitCardImage } from "./photoRelief";

/** The photo a kit card shows instead of its gradient header, and how tall it is drawn. */
export interface KitCardPhoto {
  image: KitCardImage;
  /** Tallest it is drawn, in pixels. */
  maxHeight: number;
  /** Height as a multiple of the card's width, so the photo never grows wider than the card. */
  widthRatio: number;
}

/** Pixels from the top of the card to the bottom of its photo (the header is 160 px, the photo sits 12 px up). */
export const KIT_PHOTO_BASE = 148;

/**
 * Kits whose card shows the backpack they come in, keyed by kit slug (the Shopify handle, see
 * docs/SHOPIFY_SETUP.md). Cards are narrower than these photos want to be, so the card width sets their size:
 * the Kit 72h's photo is drawn as wide as 95 % of its card (1.137 × its width tall), and the Kit 24h's so that its
 * 30 L backpack's body is 1/1.3 of the 65 L one's (the cube root of 30/65; the 24h photo shows the bag without its
 * shoulder straps). `maxHeight` caps both from the same card width on (468 px), where the Kit 72h's is twice the
 * size first asked for.
 */
const KIT_CARD_PHOTOS: ReadonlyMap<string, KitCardPhoto> = new Map([
  ["kit-24h", { image: KIT_CARD_IMAGES["kit-24h"], maxHeight: 397, widthRatio: 0.849 }],
  ["kit-72h", { image: KIT_CARD_IMAGES["kit-72h"], maxHeight: 532, widthRatio: 1.137 }],
]);

export function kitCardPhoto(slug: string): KitCardPhoto | null {
  return KIT_CARD_PHOTOS.get(slug) ?? null;
}

/** The photo that sticks out furthest among these kits (the tallest, card widths being equal), or null. */
export function tallestKitPhoto(slugs: readonly string[]): KitCardPhoto | null {
  return slugs
    .map(kitCardPhoto)
    .filter((photo): photo is KitCardPhoto => photo !== null)
    .reduce<KitCardPhoto | null>((tallest, photo) => (tallest && tallest.widthRatio >= photo.widthRatio ? tallest : photo), null);
}

/**
 * CSS custom properties with a photo's size (`--kit-photo-max`, `--kit-photo-ratio`) and where its bottom sits
 * (`--kit-photo-base`), read by the photo's height (in `cqw` of its card, a size container) and by the room
 * KitCardGrid leaves above the cards.
 */
export function kitPhotoVars(photo: KitCardPhoto): CSSProperties {
  return {
    "--kit-photo-max": `${photo.maxHeight}px`,
    "--kit-photo-ratio": photo.widthRatio,
    "--kit-photo-base": `${KIT_PHOTO_BASE}px`,
  } as CSSProperties;
}
