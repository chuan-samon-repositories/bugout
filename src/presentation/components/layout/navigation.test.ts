import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { isCurrentLink, MAX_NAV_CATEGORIES, navCategories, primaryLinks, shopLinks } from "./navigation";

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

describe("navCategories", () => {
  it("lists the catalog's categories once, in first-seen order, with Spanish labels", () => {
    const products = [
      buildProduct({ id: "a", category: "survival-kits" }),
      buildProduct({ id: "b", category: "accessories" }),
      buildProduct({ id: "c", category: "survival-kits" }),
      buildProduct({ id: "d", category: "camping-gear" }),
    ];
    expect(navCategories(products)).toEqual([
      { slug: "survival-kits", label: "Kits de supervivencia" },
      { slug: "accessories", label: "Accesorios" },
      { slug: "camping-gear", label: "Camping gear" },
    ]);
  });

  it(`shows at most ${MAX_NAV_CATEGORIES} categories`, () => {
    const products = ["a", "b", "c", "d", "e", "f"].map((slug) => buildProduct({ id: slug, category: `cat-${slug}` }));
    expect(navCategories(products).map((category) => category.slug)).toEqual(["cat-a", "cat-b", "cat-c", "cat-d"]);
    expect(navCategories([])).toEqual([]);
  });
});

describe("shopLinks and primaryLinks", () => {
  const categories = [
    { slug: "survival-kits", label: "Kits de supervivencia" },
    { slug: "camping-gear", label: "Camping" },
  ];

  it("links every category between all products and offers", () => {
    expect(shopLinks(categories)).toEqual([
      { href: "/products", label: "Todos los productos" },
      { href: "/products?category=survival-kits", label: "Kits de supervivencia" },
      { href: "/products?category=camping-gear", label: "Camping" },
      { href: "/products?sale=1", label: "Ofertas" },
    ]);
  });

  it("keeps the fixed links when the catalog could not be loaded", () => {
    expect(primaryLinks([]).map((link) => link.href)).toEqual(["/products", "/products?sale=1", "/about", "/contact"]);
  });
});
