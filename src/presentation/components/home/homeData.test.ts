import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { heroKits, pickFeatured, pickFlagship, summarizeReviews } from "./homeData";

describe("pickFeatured", () => {
  it("lists loose products (never kits), featured ones first, up to the limit", () => {
    const kit = buildProduct({ id: "kit", featured: true, details: { features: [], specifications: [], contents: [], kit: { label: "24H" } } });
    const a = buildProduct({ id: "a" });
    const b = buildProduct({ id: "b", featured: true });
    const c = buildProduct({ id: "c" });
    expect(pickFeatured([kit, a, b, c]).map((p) => p.slug)).toEqual(["b", "a", "c"]);
    expect(pickFeatured([a, c], 1).map((p) => p.slug)).toEqual(["a"]);
  });
});

describe("heroKits", () => {
  const kits = [
    { slug: "kit-24h", label: "Kit 24h" },
    { slug: "kit-72h", label: "Kit 72h" },
    { slug: "kit-custom", label: "Kit Custom" },
  ];

  it("puts the flagship kit first, then the others in catalog order", () => {
    expect(heroKits({ kits, flagshipSlug: "kit-72h" }).map((kit) => kit.slug)).toEqual(["kit-72h", "kit-24h", "kit-custom"]);
  });

  it("keeps the catalog order without a flagship", () => {
    expect(heroKits({ kits, flagshipSlug: null }).map((kit) => kit.slug)).toEqual(["kit-24h", "kit-72h", "kit-custom"]);
    expect(heroKits({ kits: [], flagshipSlug: null })).toEqual([]);
  });
});

describe("summarizeReviews", () => {
  it("weights the average by review count and ignores unrated products", () => {
    const summary = summarizeReviews([
      buildProduct({ id: "a", rating: { average: 5, count: 3 } }),
      buildProduct({ id: "b", rating: { average: 4, count: 1 } }),
      buildProduct({ id: "c", rating: null }),
      buildProduct({ id: "d", rating: { average: 0, count: 0 } }),
    ]);
    expect(summary).toEqual({ average: 4.75, count: 4 });
  });

  it("is null when nothing has reviews", () => {
    expect(summarizeReviews([buildProduct({ rating: null })])).toBeNull();
  });
});

describe("pickFlagship", () => {
  const contents = (n: number) => ({
    features: [],
    specifications: [],
    contents: Array.from({ length: n }, (_, i) => ({ item: `Item ${i}`, quantity: "1" })),
  });

  it("picks the featured kit with the most contents", () => {
    const small = buildProduct({ id: "small", featured: true, details: contents(3) });
    const big = buildProduct({ id: "big", featured: true, details: contents(8) });
    const unfeatured = buildProduct({ id: "unfeatured", details: contents(12) });
    expect(pickFlagship([small, big, unfeatured])?.slug).toBe("big");
  });

  it("never showcases a build-your-own kit, whose contents are only its backpack choices", () => {
    const custom = buildProduct({
      id: "custom",
      featured: true,
      details: { ...contents(12), kit: { label: "CUSTOM", buildYourOwn: true } },
    });
    const kit = buildProduct({ id: "kit", details: contents(3) });
    expect(pickFlagship([custom, kit])?.slug).toBe("kit");
    expect(pickFlagship([custom])).toBeNull();
  });

  it("falls back to non-featured kits and skips products without contents or stock", () => {
    const empty = buildProduct({ id: "empty", featured: true, details: null });
    const soldOut = buildProduct({ id: "sold-out", details: contents(9), inStock: false });
    const kit = buildProduct({ id: "kit", details: contents(2) });
    expect(pickFlagship([empty, soldOut, kit])?.slug).toBe("kit");
    expect(pickFlagship([empty])).toBeNull();
  });
});
