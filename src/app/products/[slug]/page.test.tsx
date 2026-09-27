// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/domain/entities/product/Product";
import { buildProduct } from "@/domain/testing/buildProduct";
import { getContainer } from "@/infrastructure/config";

const cart = vi.hoisted(() => ({
  cart: null,
  addItem: vi.fn<(product: Product, quantity: number) => Promise<boolean>>(async () => true),
  pending: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products/kit-72h",
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const analytics = vi.hoisted(() => ({ track: vi.fn(), captureException: vi.fn(), setConsent: vi.fn() }));

vi.mock("@/presentation/context/AnalyticsContext", () => ({
  useAnalytics: () => analytics,
}));

vi.mock("@/presentation/context/CartContext", () => ({
  useCart: () => cart,
}));

import ProductPage, { generateMetadata } from "./page";

const renderProduct = async (slug: string) => render(await ProductPage({ params: Promise.resolve({ slug }) }));

describe("/products/[slug]", () => {
  beforeEach(() => {
    cart.addItem.mockClear();
    analytics.track.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lets the visitor pick the number of people, updating the price and the item added", async () => {
    const user = userEvent.setup();
    await renderProduct("kit-72h");

    expect(screen.getByRole("heading", { level: 1, name: "Kit 72h" })).toBeInTheDocument();
    const people = screen.getByRole("group", { name: "Número de personas" });
    expect(within(people).getAllByRole("radio").map((radio) => radio.closest("label")?.textContent)).toEqual([
      "1 persona",
      "2 personas",
      "4 personas",
    ]);
    expect(within(people).getByRole("radio", { name: "1 persona" })).toBeChecked();
    const price = screen.getByText("119,00 €");
    // The price sits in a polite live region, so a variant change is announced.
    expect(price.closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
    expect(analytics.track).not.toHaveBeenCalledWith(expect.objectContaining({ name: "product_variant_selected" }));

    await user.click(within(people).getByRole("radio", { name: "2 personas" }));

    expect(screen.getByText("199,00 €")).toBeInTheDocument();
    expect(screen.queryByText("119,00 €")).toBeNull();
    expect(analytics.track).toHaveBeenCalledWith({
      name: "product_variant_selected",
      properties: {
        product_id: "kit-72h-2p",
        product_slug: "kit-72h",
        product_name: "Kit 72h",
        variant_title: "2 personas",
        category: "kits",
        price: 199,
        currency: "EUR",
        in_stock: true,
      },
    });
    // The specs describe the 1-person version whatever is selected, and the caption says so.
    const specs = screen.getByRole("table", { name: "Ficha técnica de la versión para 1 persona" });
    expect(within(specs).queryByRole("row", { name: /Para/ })).toBeNull();
    expect(within(specs).getByRole("row", { name: /Peso/ })).toHaveTextContent("5,4 kg");

    await user.click(screen.getByRole("button", { name: "Añadir al carrito" }));
    expect(cart.addItem).toHaveBeenCalledWith(expect.objectContaining({ variantTitle: "2 personas" }), 1);
    expect(cart.addItem.mock.calls[0][0].id.value).toBe("kit-72h-2p");
  });

  it("lists the full contents with links to the products sold separately, and the cross-sell", async () => {
    await renderProduct("kit-72h");
    const contents = screen.getByRole("region", { name: "Contenido completo" });
    expect(within(contents).getByRole("link", { name: "Radio solar" })).toHaveAttribute("href", "/products/radio-solar");
    expect(within(contents).getByText("Ración alimentaria (3 días)")).toBeInTheDocument();
    expect(within(contents).getByText(/Cantidades del kit para 1 persona/)).toBeInTheDocument();
    const crossSell = screen.getByRole("region", { name: "Añade productos" });
    expect(within(crossSell).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Lámpara de camping",
      "Mochila de supervivencia 65L",
    ]);
    expect(screen.getByRole("link", { name: /Ver la comparativa de kits/ })).toHaveAttribute("href", "/how-to-choose");
    // No kit photo yet: a decorative box with the kit label, no "coming soon" promise.
    expect(document.querySelector("[data-kit-placeholder]")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByText(/próximamente/i)).toBeNull();
  });

  it("explains the build-your-own kit and prices it as a starting point", async () => {
    await renderProduct("kit-custom");
    expect(screen.getByRole("heading", { level: 2, name: "¿Cómo funciona el Kit Custom?" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Número de personas" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Contenido completo" })).toBeNull();
    expect(screen.getByText("Desde")).toBeInTheDocument();
  });

  it("links a loose product to the kits that include it", async () => {
    await renderProduct("manta-termica");
    // The first list is the product's own; the related cards below have theirs.
    const [included] = screen.getAllByRole("list", { name: "Incluido en" });
    expect(within(included).getByRole("link", { name: "Incluido en el Kit 24h" })).toHaveAttribute("href", "/products/kit-24h");
    expect(within(included).getByRole("link", { name: "Incluido en el Kit 72h" })).toHaveAttribute("href", "/products/kit-72h");
    expect(screen.getByRole("img", { name: "Manta térmica" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Número de personas" })).toBeNull();
    // Only the short description, once: the demo product has no long description or specs.
    expect(screen.queryByRole("region", { name: "Descripción" })).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("shows a loose product's details once, below the purchase panel", async () => {
    const product = buildProduct({
      id: "frontal",
      name: "Frontal",
      description: "Linterna frontal LED.",
      category: "luz-y-energia",
      price: 14,
      rating: null,
      details: {
        longDescription: "Tres modos de luz y correa ajustable.",
        features: ["Resistente a salpicaduras"],
        specifications: [{ label: "Autonomía", value: "40 h" }],
        contents: [],
      },
    });
    vi.spyOn(getContainer().getGetProductBySlugUseCase(), "execute").mockResolvedValue(product);
    await renderProduct("frontal");

    expect(screen.getAllByText("Linterna frontal LED.")).toHaveLength(1);
    expect(within(screen.getByRole("region", { name: "Descripción" })).getByText("Tres modos de luz y correa ajustable.")).toBeInTheDocument();
    expect(screen.getAllByText("Autonomía")).toHaveLength(1);
    expect(screen.queryByRole("table")).toBeNull();
    expect(within(screen.getByRole("region", { name: "Especificaciones" })).getByText("40 h")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Características" })).toHaveTextContent("Resistente a salpicaduras");
  });

  it("leaves out the description section when a loose product has details but no long description", async () => {
    const product = buildProduct({
      id: "silbato",
      name: "Silbato",
      description: "Silbato de emergencia.",
      category: "herramientas",
      price: 5,
      rating: null,
      details: { features: [], specifications: [{ label: "Material", value: "Plástico" }], contents: [] },
    });
    vi.spyOn(getContainer().getGetProductBySlugUseCase(), "execute").mockResolvedValue(product);
    await renderProduct("silbato");
    expect(screen.getAllByText("Silbato de emergencia.")).toHaveLength(1);
    expect(screen.queryByRole("region", { name: "Descripción" })).toBeNull();
    expect(screen.getAllByText("Plástico")).toHaveLength(1);
  });

  it("titles a kit with its search title and shares its generated image", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "kit-72h" }) });
    expect(metadata.title).toBe("Kit de emergencia 72 horas para 1, 2 o 4 personas");
    expect(metadata.description).toMatch(/^Mochila de emergencia para 72 horas de autonomía/);
    expect(metadata.alternates?.canonical).toBe("/products/kit-72h");
    expect(metadata.openGraph?.images).toEqual([
      { url: "/products/kit-72h/share-image", alt: "Kit 72h en Bugout", width: 1200, height: 630 },
    ]);
  });

  it("falls back to the name and short description, and shares the product photo", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "mochila-65l" }) });
    expect(metadata.title).toBe("Mochila de supervivencia 65L");
    expect(metadata.description).toBe("Mochila de 65 litros para quien necesita llevar más equipo o montar un kit familiar.");
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: "/images/products/mochila-65l.jpg", alt: expect.any(String) }),
    ]);
  });

  it("describes the kit and its breadcrumbs as structured data", async () => {
    const { container } = await renderProduct("kit-72h");
    const [product, breadcrumbs] = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')?.textContent ?? "[]",
    );
    expect(product["@type"]).toBe("ProductGroup");
    expect(product.hasVariant.map((variant: { size: string }) => variant.size)).toEqual(["1 persona", "2 personas", "4 personas"]);
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbs.itemListElement.map((item: { name: string }) => item.name)).toEqual([
      "Inicio",
      "Productos",
      "Kits",
      "Kit 72h",
    ]);
  });
});
