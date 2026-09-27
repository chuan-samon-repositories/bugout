// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ searchParams: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
  useSearchParams: () => nav.searchParams,
}));

vi.mock("@/presentation/context/AnalyticsContext", () => ({
  useAnalytics: () => ({ track: vi.fn(), captureException: vi.fn(), setConsent: vi.fn() }),
}));

vi.mock("@/presentation/context/CartContext", () => ({
  useCart: () => ({ cart: null, addItem: vi.fn(), pending: false }),
}));

import ProductsPage, { generateMetadata } from "./page";

const INJECTED = "llama-al-900123456";

async function renderPage(query: string) {
  nav.searchParams = new URLSearchParams(query);
  const searchParams = Promise.resolve(Object.fromEntries(nav.searchParams));
  render(await ProductsPage({ searchParams }));
}

const metadataFor = (query: string) =>
  generateMetadata({ searchParams: Promise.resolve(Object.fromEntries(new URLSearchParams(query))) });

beforeEach(() => {
  vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
});

describe("/products", () => {
  it("titles a known category and lets it be indexed", async () => {
    const metadata = await metadataFor("category=luz-y-energia");
    expect(metadata.title).toBe("Luz y energía para apagones");
    expect(metadata.description).toMatch(/apagón/);
    expect(metadata.alternates?.canonical).toBe("/products?category=luz-y-energia");
    expect(metadata.openGraph).toMatchObject({ title: "Luz y energía para apagones", url: "/products?category=luz-y-energia" });
    expect(metadata.robots).toBeUndefined();
    await renderPage("category=luz-y-energia");
    expect(screen.getByRole("heading", { level: 1, name: "Luz y energía para apagones" })).toBeInTheDocument();
    expect(screen.getByText("3 productos")).toBeInTheDocument();
  });

  it("ignores an unknown category: default title and heading, every product, noindex", async () => {
    const metadata = await metadataFor(`category=${INJECTED}`);
    expect(metadata.title).toBe("Kits y equipo de emergencia");
    expect(JSON.stringify(metadata)).not.toMatch(/llama|900123456/i);
    expect(metadata.robots).toEqual({ index: false });
    expect(metadata.alternates?.canonical).toBe("/products");

    await renderPage(`category=${INJECTED}`);
    expect(screen.getByRole("heading", { level: 1, name: "Kits y equipo de emergencia" })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/llama|900123456/i);
    expect(screen.getByText("20 productos")).toBeInTheDocument();
  });

  it("keeps the other filters when only the category is unknown", async () => {
    const metadata = await metadataFor(`category=${INJECTED}&sale=1`);
    expect(metadata.robots).toEqual({ index: false });
    expect(metadata.title).not.toMatch(/llama/i);
  });
});
