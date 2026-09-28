/** A cut-out photo of a kit's backpack on a transparent background, in public/images/kit-cards/. */
export interface KitCardPhoto {
  src: string;
  width: number;
  height: number;
}

/**
 * Kits whose card shows the backpack they come in, swaying gently on white, instead of the gradient header.
 * Keyed by kit slug (the Shopify handle, see docs/SHOPIFY_SETUP.md).
 */
const KIT_CARD_PHOTOS: ReadonlyMap<string, KitCardPhoto> = new Map([
  ["kit-24h", { src: "/images/kit-cards/kit-24h.webp", width: 246, height: 360 }],
  ["kit-72h", { src: "/images/kit-cards/kit-72h.webp", width: 254, height: 304 }],
]);

export function kitCardPhoto(slug: string): KitCardPhoto | null {
  return KIT_CARD_PHOTOS.get(slug) ?? null;
}
