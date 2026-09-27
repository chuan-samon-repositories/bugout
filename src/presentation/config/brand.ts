/**
 * Brand artwork in public/images (see docs/DESIGN_SYSTEM.md). Every file exists in
 * cream (dark backgrounds), navy (light backgrounds) and orange.
 */
type BrandTone = "cream" | "navy" | "orange";

interface BrandImage {
  src: string;
  width: number;
  height: number;
}

const image = (src: string, width: number, height: number): BrandImage => ({ src, width, height });

export const brandAssets = {
  /** The oval "B" mark. */
  mark: (tone: BrandTone) => image(`/images/brand/mark-${tone}.png`, 986, 423),
  /** "BUG OUT" on one line. */
  wordmarkFlat: (tone: BrandTone) => image(`/images/brand/wordmark-flat-${tone}.png`, 964, 230),
  /** "BUG / OUT" on two lines. */
  wordmarkStacked: (tone: BrandTone) => image(`/images/brand/wordmark-stacked-${tone}.png`, 790, 454),
  /** The pixel-art frog, standing still. */
  frog: image("/images/mascot/frog.png", 298, 298),
} as const;
