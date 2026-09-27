// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { productViewedProperties } from "./productAnalytics";
import { ProductViewTracker } from "./ProductViewTracker";

const track = vi.hoisted(() => vi.fn());
vi.mock("@/presentation/context/AnalyticsContext", () => ({ useAnalytics: () => ({ track }) }));

describe("ProductViewTracker", () => {
  it("tracks product_viewed once, even when re-rendered with an equal payload", () => {
    const product = buildProduct({ id: "kit-24h", price: 199, badge: "BESTSELLER" });
    const { rerender } = render(<ProductViewTracker properties={productViewedProperties(product)} />);
    rerender(<ProductViewTracker properties={productViewedProperties(product)} />);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith({
      name: "product_viewed",
      properties: {
        product_id: "kit-24h",
        product_slug: "kit-24h",
        product_name: "Producto de prueba",
        variant_title: null,
        category: "survival-kits",
        price: 199,
        currency: "EUR",
        badge: "BESTSELLER",
        in_stock: true,
      },
    });
  });
});
