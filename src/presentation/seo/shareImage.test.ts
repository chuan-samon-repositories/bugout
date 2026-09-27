import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { shareImageColors } from "./shareImage";

describe("shareImageColors", () => {
  it("mirrors the theme tokens in globals.css", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    for (const [name, hex] of Object.entries(shareImageColors)) {
      expect(css, name).toMatch(new RegExp(`--color-${name}:\\s*${hex};`, "i"));
    }
  });
});
