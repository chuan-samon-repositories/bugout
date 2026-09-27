import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { isCurrentLink, MAX_NAV_KITS, navData, primaryLinks, shopLinks } from "./navigation";

describe("isCurrentLink", () => {
  const search = (query: string) => new URLSearchParams(query);

  it("matches plain pages by pathname", () => {
    expect(isCurrentLink("/about", "/about", null)).toBe(true);
    expect(isCurrentLink("/about", "/contact", null)).toBe(false);
  });

  it("matches catalog links by category and sale filters, ignoring sorting and prices", () => {
    expect(isCurrentLink("/products", "/products", search("sort=price-asc&min=10"))).toBe(true);
    expect(isCurrentLink("/products", "/products", search("category=herramientas"))).toBe(false);
    expect(isCurrentLink("/products?category=herramientas", "/products", search("category=herramientas&sort=rating"))).toBe(true);
    expect(isCurrentLink("/products?sale=1", "/products", search("sale=1"))).toBe(true);
    expect(isCurrentLink("/products?sale=1", "/products", search("sale=1&category=herramientas"))).toBe(false);
  });

  it("never marks catalog links before the search params are known or on product pages", () => {
    expect(isCurrentLink("/products", "/products", null)).toBe(false);
    expect(isCurrentLink("/products", "/products/kit-medicina", search(""))).toBe(false);
  });
});

const details = (contents: number, kit = true) => ({
  features: [],
  specifications: [],
  contents: Array.from({ length: contents }, (_, index) => ({ item: `Item ${index}`, quantity: "1" })),
  ...(kit ? { kit: { label: "KIT" } } : {}),
});

describe("navData", () => {
  const catalog = [
    buildProduct({ id: "kit-24h", name: "Kit 24h", details: details(9) }),
    buildProduct({ id: "manta", name: "Manta", details: details(0, false) }),
    buildProduct({ id: "kit-72h", name: "Kit 72h", details: details(18) }),
    buildProduct({ id: "kit-custom", name: "Kit Custom", details: details(1) }),
  ];

  it("lists the kits in catalog order and picks the most complete one as flagship", () => {
    expect(navData(catalog)).toEqual({
      kits: [
        { slug: "kit-24h", label: "Kit 24h" },
        { slug: "kit-72h", label: "Kit 72h" },
        { slug: "kit-custom", label: "Kit Custom" },
      ],
      flagshipSlug: "kit-72h",
    });
  });

  it("prefers a ready-made kit as flagship over a build-your-own one, and falls back to it", () => {
    const custom = buildProduct({
      id: "kit-custom",
      details: { ...details(30), kit: { label: "CUSTOM", buildYourOwn: true } },
    });
    expect(navData([...catalog.slice(0, 3), custom]).flagshipSlug).toBe("kit-72h");
    expect(navData([custom]).flagshipSlug).toBe("kit-custom");
  });

  it(`caps the kits at ${MAX_NAV_KITS} and copes with a catalog without kits`, () => {
    const many = Array.from({ length: 6 }, (_, index) => buildProduct({ id: `kit-${index}`, details: details(1) }));
    expect(navData(many).kits).toHaveLength(MAX_NAV_KITS);
    expect(navData([buildProduct()])).toEqual({ kits: [], flagshipSlug: null });
  });
});

describe("shopLinks and primaryLinks", () => {
  const kits = [
    { slug: "kit-24h", label: "Kit 24h" },
    { slug: "kit-72h", label: "Kit 72h" },
  ];

  it("links every kit, then the catalog and content pages", () => {
    expect(primaryLinks(kits)).toEqual([
      { href: "/products/kit-24h", label: "Kit 24h" },
      { href: "/products/kit-72h", label: "Kit 72h" },
      { href: "/products", label: "Productos" },
      { href: "/how-to-choose", label: "Cómo elegir" },
      { href: "/about", label: "Sobre nosotros" },
      { href: "/why-prepare", label: "Prepárate" },
    ]);
    expect(shopLinks(kits).map((link) => link.label)).toEqual(["Kit 24h", "Kit 72h", "Productos sueltos", "Cómo elegir tu kit"]);
  });

  it("keeps the fixed links when the catalog could not be loaded", () => {
    expect(primaryLinks([]).map((link) => link.href)).toEqual(["/products", "/how-to-choose", "/about", "/why-prepare"]);
  });
});
