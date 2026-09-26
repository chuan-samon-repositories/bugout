import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { productJsonLd, serializeJsonLd } from "./productJsonLd";

describe("productJsonLd", () => {
  it("describes the product with absolute URLs and a two-decimal price", () => {
    const product = buildProduct({
      id: "kit-24h",
      name: "Mochila 24H",
      price: 199,
      images: [{ url: "/images/products/backpack.png", alt: "Mochila" }],
      rating: { average: 4.9, count: 1247 },
    });
    const data = productJsonLd(product, "https://bugout.example");
    expect(data).toMatchObject({
      "@type": "Product",
      name: "Mochila 24H",
      sku: "kit-24h",
      image: ["https://bugout.example/images/products/backpack.png"],
      brand: { "@type": "Brand", name: "Bugout" },
      offers: {
        price: "199.00",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://bugout.example/products/kit-24h",
      },
      aggregateRating: { ratingValue: 4.9, reviewCount: 1247 },
    });
  });

  it("omits the rating without reviews and marks out-of-stock products", () => {
    const data = productJsonLd(buildProduct({ rating: null, inStock: false }), "https://bugout.example");
    expect(data.aggregateRating).toBeUndefined();
    expect((data.offers as { availability: string }).availability).toBe("https://schema.org/OutOfStock");
  });

  it("escapes < so the JSON cannot close the script tag", () => {
    const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
