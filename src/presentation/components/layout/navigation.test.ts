import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { EMPTY_NAV_DATA, isCurrentLink, MAX_NAV_KITS, navData, primarySections, shopLinks } from "./navigation";

describe("isCurrentLink", () => {
  const search = (query: string) => new URLSearchParams(query);

  it("matches plain pages by pathname", () => {
    expect(isCurrentLink("/about", "/about", null)).toBe(true);
    expect(isCurrentLink("/about", "/contact", null)).toBe(false);
  });

  it("never marks a link to a section of a page as current", () => {
    expect(isCurrentLink("/preparate#tarjetas", "/preparate", null)).toBe(false);
    expect(isCurrentLink("/preparate", "/preparate", null)).toBe(true);
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
    buildProduct({ id: "kit-24h", name: "Kit 24h", category: "kits", details: details(9) }),
    buildProduct({ id: "manta", name: "Manta", category: "refugio-y-abrigo", details: details(0, false) }),
    buildProduct({ id: "kit-72h", name: "Kit 72h", category: "kits", details: details(18) }),
    buildProduct({ id: "linterna", category: "luz-y-energia" }),
    buildProduct({ id: "saco", category: "refugio-y-abrigo" }),
    buildProduct({ id: "kit-custom", name: "Kit Custom", category: "kits", details: details(1) }),
  ];

  it("lists the kits in catalog order, picks the most complete one as flagship and lists the loose products' categories", () => {
    expect(navData(catalog)).toEqual({
      kits: [
        { slug: "kit-24h", label: "Kit 24h" },
        { slug: "kit-72h", label: "Kit 72h" },
        { slug: "kit-custom", label: "Kit Custom" },
      ],
      flagshipSlug: "kit-72h",
      kitsCategory: "kits",
      categories: [
        { slug: "refugio-y-abrigo", label: "Refugio y abrigo" },
        { slug: "luz-y-energia", label: "Luz y energía" },
      ],
    });
  });

  it("has no kits category when the kits are in different categories", () => {
    const mixed = [buildProduct({ id: "a", category: "kits", details: details(1) }), buildProduct({ id: "b", category: "agua", details: details(1) })];
    expect(navData(mixed).kitsCategory).toBeNull();
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
    expect(navData([buildProduct({ category: "agua" })])).toEqual({
      kits: [],
      flagshipSlug: null,
      kitsCategory: null,
      categories: [{ slug: "agua", label: "Agua" }],
    });
  });
});

describe("shopLinks and primarySections", () => {
  const kits = [
    { slug: "kit-24h", label: "Kit 24h" },
    { slug: "kit-72h", label: "Kit 72h" },
  ];

  it("offers Kits, Productos and Prepárate, with the kits and the categories in their dropdowns", () => {
    const categories = [
      { slug: "agua", label: "Agua" },
      { slug: "herramientas", label: "Herramientas" },
    ];
    expect(primarySections({ kits, kitsCategory: "kits", categories })).toEqual([
      {
        href: "/products?category=kits",
        label: "Kits",
        children: [
          { href: "/products/kit-24h", label: "Kit 24h" },
          { href: "/products/kit-72h", label: "Kit 72h" },
        ],
      },
      {
        href: "/products",
        label: "Productos",
        children: [
          { href: "/products?category=agua", label: "Agua" },
          { href: "/products?category=herramientas", label: "Herramientas" },
        ],
      },
      { href: "/preparate", label: "Prepárate", children: [] },
    ]);
    expect(shopLinks(kits).map((link) => link.label)).toEqual(["Kit 24h", "Kit 72h", "Productos sueltos", "Cómo elegir tu kit"]);
  });

  it("gives Prepárate the dropdown links it is passed", () => {
    const prepare = [{ href: "/preparate#tarjetas", label: "Tarjetas de acción" }];
    expect(primarySections(EMPTY_NAV_DATA, prepare)[2]).toEqual({ href: "/preparate", label: "Prepárate", children: prepare });
  });

  it("keeps the three sections, without dropdowns, when the catalog could not be loaded", () => {
    const sections = primarySections(EMPTY_NAV_DATA);
    expect(sections.map((section) => [section.label, section.href])).toEqual([
      ["Kits", "/products"],
      ["Productos", "/products"],
      ["Prepárate", "/preparate"],
    ]);
    expect(sections.every((section) => section.children.length === 0)).toBe(true);
  });
});
