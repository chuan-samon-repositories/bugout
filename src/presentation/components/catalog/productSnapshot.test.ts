import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { fromProductSnapshot, toProductSnapshot } from "./productSnapshot";

describe("product snapshots", () => {
  it("is plain JSON and rebuilds an equivalent product", () => {
    const product = buildProduct({
      id: "kit-72h",
      price: 299,
      originalPrice: 399,
      badge: "PREMIUM",
      featured: true,
      images: [{ url: "/images/products/backpack.png", alt: "Mochila", width: 1024, height: 1536 }],
      details: {
        longDescription: "Larga",
        features: ["Ligera"],
        specifications: [{ label: "Peso", value: "6,8 kg" }],
        contents: [{ item: "Radio", quantity: "1" }],
      },
    });

    const snapshot = toProductSnapshot(product);
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);

    const rebuilt = fromProductSnapshot(snapshot);
    expect(rebuilt.id.value).toBe("kit-72h");
    expect(rebuilt.price.equals(product.price)).toBe(true);
    expect(rebuilt.originalPrice?.equals(product.originalPrice!)).toBe(true);
    expect(rebuilt.isOnSale()).toBe(true);
    expect(rebuilt.details).toEqual(product.details);
    expect(rebuilt.images).toEqual(product.images);
    expect(rebuilt.rating).toEqual(product.rating);
  });

  it("keeps variants, the selected one, kit info and cross-sells", () => {
    const kit = buildProduct({
      id: "kit-24h",
      variants: [
        { id: "kit-24h-1p", title: "1 persona", price: 39 },
        { id: "kit-24h-2p", title: "2 personas", price: 69, originalPrice: 79 },
      ],
      details: {
        features: [],
        specifications: [],
        contents: [{ item: "Manta", quantity: "1", productSlug: "manta-termica" }],
        kit: { label: "24H", buildYourOwn: false },
        related: ["silbato"],
      },
    }).withVariant("kit-24h-2p");

    const snapshot = toProductSnapshot(kit);
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
    const rebuilt = fromProductSnapshot(snapshot);
    expect(rebuilt.id.value).toBe("kit-24h-2p");
    expect(rebuilt.variantTitle).toBe("2 personas");
    expect(rebuilt.isOnSale()).toBe(true);
    expect(rebuilt.variants.map((variant) => [variant.id.value, variant.price.amount])).toEqual([
      ["kit-24h-1p", 39],
      ["kit-24h-2p", 69],
    ]);
    expect(rebuilt.details).toEqual(kit.details);
    expect(rebuilt.isKit()).toBe(true);
  });

  it("keeps null prices, ratings and details", () => {
    const rebuilt = fromProductSnapshot(toProductSnapshot(buildProduct({ rating: null })));
    expect(rebuilt.originalPrice).toBeNull();
    expect(rebuilt.rating).toBeNull();
    expect(rebuilt.details).toBeNull();
  });
});
