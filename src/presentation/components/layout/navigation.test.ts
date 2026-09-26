import { describe, expect, it } from "vitest";
import { isCurrentLink } from "./navigation";

describe("isCurrentLink", () => {
  const search = (query: string) => new URLSearchParams(query);

  it("matches plain pages by pathname", () => {
    expect(isCurrentLink("/about", "/about", null)).toBe(true);
    expect(isCurrentLink("/about", "/contact", null)).toBe(false);
  });

  it("matches catalog links by category and sale filters, ignoring sorting and prices", () => {
    expect(isCurrentLink("/products", "/products", search("sort=price-asc&min=10"))).toBe(true);
    expect(isCurrentLink("/products", "/products", search("category=accessories"))).toBe(false);
    expect(isCurrentLink("/products?category=accessories", "/products", search("category=accessories&sort=rating"))).toBe(true);
    expect(isCurrentLink("/products?sale=1", "/products", search("sale=1"))).toBe(true);
    expect(isCurrentLink("/products?sale=1", "/products", search("sale=1&category=accessories"))).toBe(false);
  });

  it("never marks catalog links before the search params are known or on product pages", () => {
    expect(isCurrentLink("/products", "/products", null)).toBe(false);
    expect(isCurrentLink("/products", "/products/first-aid-pro", search(""))).toBe(false);
  });
});
