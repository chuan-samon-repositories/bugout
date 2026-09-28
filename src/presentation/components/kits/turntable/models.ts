import type { TurntableShape } from "./mesh";
import { mochila24h } from "./mochila-24h.model";
import { mochila30l } from "./mochila-30l.model";

/** A product that turns in 3D: files and shape baked by scripts/turntable/bake.py. */
export interface TurntableModel {
  /** Colour texture wrapped round the shape (a power-of-two WebP). */
  texture: string;
  /** The model at its start angle: shown until WebGL draws, and instead of it (reduced motion, no WebGL). */
  poster: { src: string; width: number; height: number };
  shape: TurntableShape;
}

export const TURNTABLE_MODELS = {
  "mochila-24h": mochila24h,
  "mochila-30l": mochila30l,
} as const satisfies Record<string, TurntableModel>;

export type TurntableModelId = keyof typeof TURNTABLE_MODELS;

/**
 * Kits whose card shows their backpack turning instead of the gradient header, by kit slug (the Shopify handle,
 * see docs/SHOPIFY_SETUP.md). Each kit comes in its own 30 L backpack: the Kit 72h's is the catalog's Mochila
 * 30L (three photos), the Kit 24h's a MOLLE pack built from a single photo, so its back is invented.
 */
const KIT_TURNTABLES: ReadonlyMap<string, TurntableModelId> = new Map([
  ["kit-24h", "mochila-24h"],
  ["kit-72h", "mochila-30l"],
]);

export function turntableForKit(slug: string): TurntableModelId | null {
  return KIT_TURNTABLES.get(slug) ?? null;
}
