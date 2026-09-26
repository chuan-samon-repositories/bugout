import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { pickFeatured, summarizeReviews } from "./homeData";

describe("pickFeatured", () => {
  it("prefers featured products and falls back to the first ones", () => {
    const a = buildProduct({ id: "a" });
    const b = buildProduct({ id: "b", featured: true });
    const c = buildProduct({ id: "c" });
    expect(pickFeatured([a, b, c]).map((p) => p.slug)).toEqual(["b"]);
    expect(pickFeatured([a, c], 1).map((p) => p.slug)).toEqual(["a"]);
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
