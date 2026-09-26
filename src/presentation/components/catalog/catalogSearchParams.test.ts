import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { SORT_OPTIONS, type FilterCriteria } from "@/application/dtos/FilterCriteria";
import {
  clearFilters,
  countActiveFilters,
  parseCatalogSearchParams,
  parsePrice,
  serializeCatalogCriteria,
} from "./catalogSearchParams";

describe("parseCatalogSearchParams", () => {
  it("returns the defaults for an empty query", () => {
    expect(parseCatalogSearchParams({})).toEqual({ sortBy: "featured" });
    expect(parseCatalogSearchParams(new URLSearchParams())).toEqual({ sortBy: "featured" });
  });

  it("reads every supported parameter", () => {
    const params = new URLSearchParams("category=accessories&sort=price-asc&min=20&max=150.5&stock=1&sale=1");
    expect(parseCatalogSearchParams(params)).toEqual({
      category: "accessories",
      sortBy: "price-asc",
      priceMin: 20,
      priceMax: 150.5,
      inStockOnly: true,
      onSaleOnly: true,
    });
  });

  it("accepts the record shape Next.js passes to pages, using the first of repeated values", () => {
    expect(parseCatalogSearchParams({ category: ["survival-kits", "accessories"], sort: "rating" })).toEqual({
      category: "survival-kits",
      sortBy: "rating",
    });
  });

  it("falls back to defaults for invalid values", () => {
    const params = new URLSearchParams("category=%20%20&sort=cheapest&min=-5&max=abc&stock=yes&sale=true");
    expect(parseCatalogSearchParams(params)).toEqual({ sortBy: "featured" });
  });

  it("keeps a zero minimum price instead of treating it as missing", () => {
    expect(parseCatalogSearchParams({ min: "0" }).priceMin).toBe(0);
  });
});

describe("parsePrice", () => {
  it("parses non-negative decimals, including a comma separator", () => {
    expect(parsePrice("49")).toBe(49);
    expect(parsePrice(" 49,5 ")).toBe(49.5);
    expect(parsePrice("0")).toBe(0);
  });

  it("rejects negatives, blanks, exponents and text", () => {
    for (const value of [undefined, "", "  ", "-1", "1e3", "12abc", "Infinity", "NaN"]) {
      expect(parsePrice(value)).toBeUndefined();
    }
  });
});

describe("serializeCatalogCriteria", () => {
  it("omits defaults", () => {
    expect(serializeCatalogCriteria({ sortBy: "featured" }).toString()).toBe("");
    expect(serializeCatalogCriteria({ sortBy: "featured", inStockOnly: false, category: "" }).toString()).toBe("");
  });

  it("writes active criteria with the catalog's short keys", () => {
    const query = serializeCatalogCriteria({
      category: "accessories",
      sortBy: "price-desc",
      priceMin: 0,
      priceMax: 100,
      inStockOnly: true,
      onSaleOnly: true,
    });
    expect(Object.fromEntries(query)).toEqual({
      category: "accessories",
      sort: "price-desc",
      min: "0",
      max: "100",
      stock: "1",
      sale: "1",
    });
  });

  it("skips NaN and negative prices", () => {
    expect(serializeCatalogCriteria({ sortBy: "featured", priceMin: Number.NaN, priceMax: -1 }).toString()).toBe("");
  });

  it("round-trips any valid criteria through the query string", () => {
    const criteriaArb: fc.Arbitrary<FilterCriteria> = fc.record(
      {
        category: fc.constantFrom("survival-kits", "accessories", "camping-gear"),
        priceMin: fc.integer({ min: 0, max: 100_000 }).map((cents) => cents / 100),
        priceMax: fc.integer({ min: 0, max: 100_000 }).map((cents) => cents / 100),
        inStockOnly: fc.constant(true),
        onSaleOnly: fc.constant(true),
        sortBy: fc.constantFrom(...SORT_OPTIONS),
      },
      { requiredKeys: ["sortBy"] },
    );
    fc.assert(
      fc.property(criteriaArb, (criteria) => {
        const parsed = parseCatalogSearchParams(new URLSearchParams(serializeCatalogCriteria(criteria).toString()));
        expect(parsed).toEqual(criteria);
      }),
    );
  });
});

describe("countActiveFilters and clearFilters", () => {
  it("counts filters but not the sort order, and a price range once", () => {
    expect(countActiveFilters({ sortBy: "rating" })).toBe(0);
    expect(countActiveFilters({ sortBy: "featured", category: "accessories", priceMin: 10, priceMax: 50 })).toBe(2);
    expect(countActiveFilters({ sortBy: "featured", priceMin: 0, inStockOnly: true, onSaleOnly: true })).toBe(3);
  });

  it("clears filters and keeps the sort order", () => {
    expect(clearFilters({ sortBy: "price-asc", category: "accessories", onSaleOnly: true })).toEqual({ sortBy: "price-asc" });
  });
});
