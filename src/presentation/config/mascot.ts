/**
 * The one switch for the pixel-art frog mascot (`FrogMascot` and `brandAssets.frog`).
 *
 * The frog is hidden while it has no role on the site: it does not react to the visitor or
 * guide them anywhere, so it is decoration only. Its component, sprite, CSS and images stay
 * in the code; set this to true to show it again in the home hero, the "Por qué prepararse"
 * teaser and the 404 page.
 */
export const MASCOT_ENABLED: boolean = false;

export function isMascotEnabled(): boolean {
  return MASCOT_ENABLED;
}
