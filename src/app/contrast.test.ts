import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the colour pairs the UI uses (see the rules at the top of globals.css):
 * editing a token so that a pair drops below WCAG AA fails here, before axe runs.
 */
const css = readFileSync(join(__dirname, "globals.css"), "utf8");
const tokens = Object.fromEntries(
  [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6});/gi)].map(([, name, hex]) => [name, hex.toLowerCase()]),
);
const color = (name: string) => (name === "white" ? "#ffffff" : tokens[name]);

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const value = parseInt(hex.slice(i, i + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(color(foreground)), luminance(color(background))].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/** [text, background] pairs used for normal-size text. */
const TEXT_PAIRS: Array<[string, string]> = [
  // Light surfaces: page (sand), cards (white), teaser bands (sand-dim).
  ...["white", "sand", "sand-dim"].flatMap((bg) =>
    ["navy-deep", "ink", "navy", "muted", "accent", "accent-hover", "danger", "success"].map(
      (fg) => [fg, bg] as [string, string],
    ),
  ),
  ["accent", "accent-soft"],
  ["navy-deep", "accent-soft"],
  // Orange buttons, chips and badges carry navy-deep text, also on hover.
  ["navy-deep", "orange"],
  ["navy-deep", "orange-hover"],
  // Dark surfaces: hero, header, footer, "what's inside", page heroes.
  ...["navy", "navy-deep", "navy-darker"].flatMap((bg) =>
    ["sand", "white", "orange-on-navy"].map((fg) => [fg, bg] as [string, string]),
  ),
  ["orange", "navy-deep"],
  ["orange", "navy-darker"],
  // "Llama al 112" box on the action cards.
  ["white", "danger"],
  // Action-card category badges and bands: white text, except ink on the amber of "Fenómenos naturales".
  ...["deck-pm", "deck-cl", "deck-ev", "deck-te", "deck-pa", "deck-ad"].map((bg) => ["white", bg] as [string, string]),
  ["ink", "deck-na"],
];

describe("theme colour contrast", () => {
  it("defines every token the pairs use", () => {
    for (const name of new Set(TEXT_PAIRS.flat())) expect(color(name), name).toMatch(/^#[0-9a-f]{6}$/);
  });

  it.each(TEXT_PAIRS)("%s text on %s meets WCAG AA (4.5:1)", (foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps white text off the brand orange (it fails AA)", () => {
    expect(contrast("white", "orange")).toBeLessThan(4.5);
  });
});
