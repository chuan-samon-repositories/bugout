// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CART_STORAGE_KEY } from "@/infrastructure/adapters/cart/LocalStorageCartAdapter";
import { CONSENT_STORAGE_KEY } from "@/infrastructure/adapters/consent/LocalStorageConsentRepository";
import { LAST_ORDER_STORAGE_KEY } from "@/infrastructure/adapters/order/SessionStorageOrderConfirmationStore";
import { SHOPIFY_CART_ID_KEY, SHOPIFY_CART_REVISION_KEY } from "@/infrastructure/adapters/shopify/ShopifyCartIdStore";
import { CookieTable } from "./CookieTable";

describe("CookieTable", () => {
  it("documents the storage keys the adapters actually use", () => {
    render(<CookieTable />);
    for (const key of [
      CART_STORAGE_KEY,
      CONSENT_STORAGE_KEY,
      SHOPIFY_CART_ID_KEY,
      SHOPIFY_CART_REVISION_KEY,
      LAST_ORDER_STORAGE_KEY,
    ]) {
      const row = screen.getByRole("rowheader", { name: new RegExp(`^${key.replace(".", "\\.")}`) });
      expect(within(row.closest("tr") as HTMLElement).getByText("Necesaria")).toBeInTheDocument();
    }
  });

  it("marks the PostHog entries as analytics that need consent", () => {
    render(<CookieTable />);
    const row = screen.getByRole("rowheader", { name: /^ph_<clave>_posthog/ }).closest("tr") as HTMLElement;
    expect(within(row).getByText("Analítica (requiere consentimiento)")).toBeInTheDocument();
    expect(within(row).getByText("PostHog")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Cookies y datos que guardamos en tu navegador" })).toBeInTheDocument();
  });
});
