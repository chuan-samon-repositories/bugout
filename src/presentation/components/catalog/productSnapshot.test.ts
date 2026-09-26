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

  it("keeps null prices, ratings and details", () => {
    const rebuilt = fromProductSnapshot(toProductSnapshot(buildProduct({ rating: null })));
    expect(rebuilt.originalPrice).toBeNull();
    expect(rebuilt.rating).toBeNull();
    expect(rebuilt.details).toBeNull();
  });
});
