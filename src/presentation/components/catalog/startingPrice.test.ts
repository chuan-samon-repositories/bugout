import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { hasStartingPrice, startingPriceLabel } from "./startingPrice";

describe("startingPriceLabel", () => {
  it("says 'Desde' for products whose variants have different prices", () => {
    const kit = buildProduct({
      variants: [
        { id: "kit-1p", title: "1 persona", price: 39 },
        { id: "kit-2p", title: "2 personas", price: 69 },
      ],
    });
    expect(hasStartingPrice(kit)).toBe(true);
    expect(startingPriceLabel(kit)).toBe("Desde 39,00 €");
  });

  it("says 'Desde' for a build-your-own kit base with a single price", () => {
    const custom = buildProduct({
      price: 59,
      details: { features: [], specifications: [], contents: [], related: [], kit: { label: "CUSTOM", buildYourOwn: true } },
    });
    expect(hasStartingPrice(custom)).toBe(true);
    expect(startingPriceLabel(custom)).toBe("Desde 59,00 €");
  });

  it("shows the plain price otherwise", () => {
    const plain = buildProduct({ price: 5 });
    expect(hasStartingPrice(plain)).toBe(false);
    expect(startingPriceLabel(plain)).toBe("5,00 €");
  });
});
