import { describe, expect, it } from "vitest";
import { SORT_OPTIONS } from "@/application/dtos/FilterCriteria";
import { buildProduct } from "@/domain/testing/buildProduct";
import { availableSortOptions } from "./sortOptions";

describe("availableSortOptions", () => {
  it("offers every option when some product has reviews", () => {
    const products = [buildProduct({ id: "a", rating: null }), buildProduct({ id: "b", rating: { average: 4, count: 2 } })];
    expect(availableSortOptions(products)).toEqual([...SORT_OPTIONS]);
  });

  it("hides the rating sorts when no product has reviews", () => {
    const products = [buildProduct({ id: "a", rating: null }), buildProduct({ id: "b", rating: { average: 0, count: 0 } })];
    expect(availableSortOptions(products)).toEqual(["featured", "price-asc", "price-desc"]);
    expect(availableSortOptions([])).toEqual(["featured", "price-asc", "price-desc"]);
  });

  it("keeps the selected option so the select can show it", () => {
    expect(availableSortOptions([buildProduct({ rating: null })], "reviews")).toEqual([
      "featured",
      "price-asc",
      "price-desc",
      "reviews",
    ]);
  });
});
