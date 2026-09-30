import { describe, expect, it } from "vitest";
import { ACTION_CARDS } from "@/presentation/prepare/cards";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists the Prepárate pages under their Spanish paths, dated by the content review", async () => {
    const entries = await sitemap();
    const prepare = entries.filter((entry) => new URL(entry.url).pathname.startsWith("/preparate"));
    expect(prepare.map((entry) => new URL(entry.url).pathname)).toEqual([
      "/preparate",
      "/preparate/lista-del-kit-de-emergencia",
      ...ACTION_CARDS.map((card) => `/preparate/${card.slug}`),
    ]);
    expect(prepare.every((entry) => entry.lastModified === "2026-09-30")).toBe(true);
    expect(entries.some((entry) => entry.url.includes("why-prepare"))).toBe(false);
    expect(entries.some((entry) => new URL(entry.url).pathname === "/products/kit-72h")).toBe(true);
  });
});
