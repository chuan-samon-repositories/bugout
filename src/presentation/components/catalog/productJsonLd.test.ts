import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { testPricingPolicy } from "@/domain/testing/testPricingPolicy";
import { productJsonLd } from "./productJsonLd";

const context = { origin: "https://bugout.example", policy: testPricingPolicy };

type Offer = {
  price: string;
  availability: string;
  shippingDetails: Array<{
    shippingRate: { value: string };
    shippingDestination: { addressCountry: string; postalCodePrefix: string[] };
  }>;
  hasMerchantReturnPolicy: Record<string, unknown>;
};

type Variant = { name: string; size: string; sku?: string; offers: Offer };

describe("productJsonLd", () => {
  it("gives a build-your-own kit, which is not sold as such, no offer", () => {
    const custom = buildProduct({
      id: "kit-custom",
      name: "Kit Custom",
      details: { features: [], specifications: [], contents: [], kit: { label: "CUSTOM", buildYourOwn: true } },
    });
    const data = productJsonLd(custom, context);
    expect(data.name).toBe("Kit Custom");
    expect(data).not.toHaveProperty("offers");
  });

  it("describes the product with absolute URLs and a two-decimal price", () => {
    const product = buildProduct({
      id: "kit-24h",
      name: "Mochila 24H",
      price: 199,
      images: [{ url: "/images/products/backpack.png", alt: "Mochila" }],
      rating: { average: 4.9, count: 1247 },
    });
    const data = productJsonLd(product, context);
    expect(data).toMatchObject({
      "@type": "Product",
      name: "Mochila 24H",
      url: "https://bugout.example/products/kit-24h",
      sku: "kit-24h",
      image: ["https://bugout.example/images/products/backpack.png"],
      brand: { "@type": "Brand", name: "Bugout" },
      offers: {
        "@type": "Offer",
        price: "199.00",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        url: "https://bugout.example/products/kit-24h",
      },
      aggregateRating: { ratingValue: 4.9, reviewCount: 1247 },
    });
  });

  it("omits the rating without reviews and marks out-of-stock products", () => {
    const data = productJsonLd(buildProduct({ rating: null, inStock: false }), context);
    expect(data.aggregateRating).toBeUndefined();
    expect((data.offers as Offer).availability).toBe("https://schema.org/OutOfStock");
  });

  it("omits image when the product has no images", () => {
    const data = productJsonLd(buildProduct({ images: [] }), context);
    expect(data).not.toHaveProperty("image");
  });

  it("emits sku for catalog ids but not for Shopify GIDs", () => {
    const shopify = productJsonLd(buildProduct({ id: "gid://shopify/ProductVariant/4455", slug: "mochila-72h" }), context);
    expect(shopify).not.toHaveProperty("sku");
    expect(productJsonLd(buildProduct({ id: "first-aid-pro" }), context).sku).toBe("first-aid-pro");
  });

  it("prices every shipping method for the product alone, free standard shipping from the threshold", () => {
    const rates = (price: number) =>
      (productJsonLd(buildProduct({ price }), context).offers as Offer).shippingDetails.map(
        (details) => details.shippingRate.value,
      );
    expect(rates(20)).toEqual(["4.95", "9.95", "14.95"]);
    expect(rates(75)).toEqual(["0.00", "9.95", "14.95"]);
  });

  it("ships to the peninsula and the Balearic Islands only", () => {
    const [details] = (productJsonLd(buildProduct(), context).offers as Offer).shippingDetails;
    const { addressCountry, postalCodePrefix } = details.shippingDestination;
    expect(addressCountry).toBe("ES");
    expect(postalCodePrefix).toHaveLength(48);
    expect(postalCodePrefix).toContain("07");
    for (const excluded of ["35", "38", "51", "52"]) expect(postalCodePrefix).not.toContain(excluded);
  });

  it("states the returns policy of the shipping and returns page", () => {
    expect((productJsonLd(buildProduct(), context).offers as Offer).hasMerchantReturnPolicy).toEqual({
      "@type": "MerchantReturnPolicy",
      applicableCountry: "ES",
      returnPolicyCountry: "ES",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 30,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    });
  });

  it("describes a kit sold in several sizes as a ProductGroup with one Product and Offer per variant", () => {
    const kit = buildProduct({
      id: "kit-72h",
      name: "Kit 72h",
      variants: [
        { id: "kit-72h-1p", title: "1 persona", price: 119, inStock: false },
        { id: "kit-72h-2p", title: "2 personas", price: 199 },
        { id: "kit-72h-4p", title: "4 personas", price: 359 },
      ],
    });
    const data = productJsonLd(kit, context);
    expect(data).toMatchObject({
      "@type": "ProductGroup",
      name: "Kit 72h",
      productGroupID: "kit-72h",
      variesBy: "https://schema.org/size",
      url: "https://bugout.example/products/kit-72h",
    });
    expect(data).not.toHaveProperty("sku");
    expect(data).not.toHaveProperty("offers");
    const variants = data.hasVariant as Variant[];
    expect(variants.map((variant) => [variant.name, variant.size, variant.sku, variant.offers.price])).toEqual([
      ["Kit 72h · 1 persona", "1 persona", "kit-72h-1p", "119.00"],
      ["Kit 72h · 2 personas", "2 personas", "kit-72h-2p", "199.00"],
      ["Kit 72h · 4 personas", "4 personas", "kit-72h-4p", "359.00"],
    ]);
    expect(variants[0].offers.availability).toBe("https://schema.org/OutOfStock");
    expect(variants[1].offers.availability).toBe("https://schema.org/InStock");
  });
});
