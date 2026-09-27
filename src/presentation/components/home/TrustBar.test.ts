import { describe, expect, it } from "vitest";
import { testPricingPolicy } from "@/domain/testing/testPricingPolicy";
import { trustItems } from "./TrustBar";

describe("trustItems", () => {
  it("quotes shipping from the pricing policy and returns from the site config", () => {
    expect(trustItems(testPricingPolicy).map(({ title, text }) => [title, text])).toEqual([
      ["Envío gratis desde 75,00\u00a0€", "Entrega en 3–5 días laborables"],
      ["Península y Baleares", "Enviamos a toda la España peninsular y a las islas Baleares"],
      ["Control de caducidades", "Te avisamos para renovar los consumibles"],
      ["30 días para devolver", "Sin necesidad de indicar el motivo"],
    ]);
  });

  it("quotes the standard price when shipping is never free", () => {
    const paid = {
      ...testPricingPolicy,
      shippingRates: testPricingPolicy.shippingRates.map((rate) => ({ ...rate, freeFrom: null })),
    };
    expect(trustItems(paid)[0].title).toBe("Envío estándar por 4,95\u00a0€");
  });
});
