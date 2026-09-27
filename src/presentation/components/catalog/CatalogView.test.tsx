// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import type { FilterCriteria } from "@/application/dtos/FilterCriteria";
import { buildProduct } from "@/domain/testing/buildProduct";
import { parseCatalogSearchParams } from "./catalogSearchParams";
import { ANALYTICS_DEBOUNCE_MS, CatalogView } from "./CatalogView";
import { toProductSnapshot } from "./productSnapshot";

const nav = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}));
const analytics = vi.hoisted(() => ({
  track: vi.fn(),
  captureException: vi.fn(),
  setConsent: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
  useSearchParams: () => nav.searchParams,
}));

vi.mock("@/presentation/context/AnalyticsContext", () => ({
  useAnalytics: () => analytics,
}));

vi.mock("@/presentation/context/CartContext", () => ({
  useCart: () => ({ cart: null, addItem: vi.fn(), pending: false }),
}));

const products = [
  buildProduct({ id: "kit-24h", name: "Mochila 24H", category: "kits", price: 199, featured: true }),
  buildProduct({ id: "kit-72h", name: "Mochila 72H", category: "kits", price: 299, featured: true }),
  buildProduct({ id: "food", name: "Comida de emergencia", category: "herramientas", price: 49 }),
  buildProduct({ id: "water", name: "Potabilizador", category: "herramientas", price: 39, inStock: false }),
].map(toProductSnapshot);

/** Renders as the page does: the server parses the same URL the client sees. */
function renderCatalog(query = "") {
  nav.searchParams = new URLSearchParams(query);
  const user = userEvent.setup();
  const initialCriteria: FilterCriteria = parseCatalogSearchParams(nav.searchParams, {
    categories: ["kits", "herramientas"],
  });
  const view = render(<CatalogView products={products} initialCriteria={initialCriteria} />);
  return { user, ...view };
}

const productNames = () => screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
const chip = (name: RegExp) =>
  within(screen.getByRole("navigation", { name: "Categorías" })).getByRole("link", { name });

/** URL written by the view through window.history.replaceState (the third argument). */
let replaceState: MockInstance<History["replaceState"]>;
const lastUrl = () => replaceState.mock.lastCall?.[2];

describe("CatalogView", () => {
  beforeEach(() => {
    replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    nav.searchParams = new URLSearchParams();
    analytics.track.mockReset();
  });

  afterEach(() => {
    replaceState.mockRestore();
  });

  it("lists every product without touching the URL or analytics on first render", () => {
    vi.useFakeTimers();
    try {
      renderCatalog();
      expect(screen.getByRole("heading", { level: 1, name: "Productos" })).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: /Mochila|Comida|Potabilizador/ })).toHaveLength(4);
      expect(screen.getByText("4 productos")).toHaveAttribute("aria-live", "polite");
      // Past the analytics debounce, so a filter event would have been sent by now.
      act(() => vi.advanceTimersByTime(ANALYTICS_DEBOUNCE_MS + 100));
      expect(replaceState).not.toHaveBeenCalled();
      expect(analytics.track).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("filters by category, updates the heading and syncs the URL", async () => {
    const { user } = renderCatalog();
    await user.click(chip(/^Herramientas/));

    expect(screen.getByRole("heading", { level: 1, name: "Herramientas" })).toBeInTheDocument();
    expect(screen.getByText("2 productos")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mochila 24H" })).toBeNull();
    expect(screen.getByRole("link", { name: "Comida de emergencia" })).toBeInTheDocument();
    expect(lastUrl()).toBe("/products?category=herramientas");
  });

  it("computes category counts from the full catalog, not the filtered list", async () => {
    const { user } = renderCatalog();
    await user.click(chip(/^Herramientas/));
    await user.click(screen.getByRole("checkbox", { name: "Solo en stock" }));

    expect(screen.getByText("1 producto")).toBeInTheDocument();
    expect(chip(/^Todas/).textContent).toContain("(4)");
    expect(chip(/^Kits/).textContent).toContain("(2)");
    expect(chip(/^Herramientas/).textContent).toContain("(2)");
    expect(lastUrl()).toBe("/products?category=herramientas&stock=1");
  });

  it("keeps focus and value while typing a maximum price, then filters after the debounce", async () => {
    const { user } = renderCatalog();
    const max = screen.getByLabelText("Máximo");
    await user.click(max);
    await user.type(max, "100");

    expect(max).toHaveFocus();
    expect(max).toHaveValue(100);
    await waitFor(() => expect(lastUrl()).toBe("/products?max=100"));
    expect(screen.getByLabelText("Máximo")).toBe(max);
    expect(max).toHaveFocus();
    expect(screen.getByText("2 productos")).toBeInTheDocument();
  });

  it("hints when the minimum is above the maximum", async () => {
    const { user } = renderCatalog();
    await user.type(screen.getByLabelText("Mínimo"), "300");
    await user.type(screen.getByLabelText("Máximo"), "40");
    expect(screen.getByText(/El mínimo es mayor que el máximo/)).toBeInTheDocument();
  });

  it("starts from the server-parsed criteria and can clear the filters", async () => {
    const { user } = renderCatalog("sort=price-asc&sale=1");
    expect(screen.getByRole("checkbox", { name: "Solo ofertas" })).toBeChecked();
    expect(screen.getByLabelText("Ordenar por")).toHaveValue("price-asc");
    expect(screen.getByText("0 productos")).toBeInTheDocument();

    const empty = screen.getByRole("heading", { name: /No hay productos/ }).parentElement!;
    await user.click(within(empty).getByRole("button", { name: "Limpiar filtros" }));

    expect(screen.getByText("4 productos")).toBeInTheDocument();
    expect(productNames()).toEqual(["Filtros", "Potabilizador", "Comida de emergencia", "Mochila 24H", "Mochila 72H"]);
    expect(lastUrl()).toBe("/products?sort=price-asc");
    // Nothing is on sale, so once the filter is off "Solo ofertas" is no longer offered.
    expect(screen.queryByRole("checkbox", { name: "Solo ofertas" })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Solo en stock" })).toBeInTheDocument();
  });

  it("offers 'Solo ofertas' only when some product is on sale", async () => {
    const onSale = [...products, toProductSnapshot(buildProduct({ id: "manta", name: "Manta", category: "herramientas", price: 6, originalPrice: 8 }))];
    const user = userEvent.setup();
    render(<CatalogView products={onSale} initialCriteria={{ sortBy: "featured" }} />);
    await user.click(screen.getByRole("checkbox", { name: "Solo ofertas" }));
    expect(screen.getByText("1 producto")).toBeInTheDocument();
    expect(lastUrl()).toBe("/products?sale=1");
  });

  it("sorts with the select and reports the change to analytics", async () => {
    const { user } = renderCatalog();
    await user.selectOptions(screen.getByLabelText("Ordenar por"), "price-desc");
    expect(lastUrl()).toBe("/products?sort=price-desc");
    await waitFor(() =>
      expect(analytics.track).toHaveBeenCalledWith({
        name: "products_filtered",
        properties: expect.objectContaining({ sort_by: "price-desc", result_count: 4, category: null }),
      }),
    );
    expect(analytics.track).toHaveBeenCalledTimes(1);
  });

  it("adopts URL changes it did not make, such as a link to another category", () => {
    const { rerender } = renderCatalog();
    nav.searchParams = new URLSearchParams("category=kits&max=250");
    rerender(<CatalogView products={products} initialCriteria={{ sortBy: "featured" }} />);

    expect(screen.getByRole("heading", { level: 1, name: "Kits" })).toBeInTheDocument();
    expect(screen.getByLabelText("Máximo")).toHaveValue(250);
    expect(screen.getByText("1 producto")).toBeInTheDocument();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("ignores its own URL writes when Next.js syncs them back, even if they arrive late", async () => {
    const { user, rerender } = renderCatalog();
    const view = () => <CatalogView products={products} initialCriteria={{ sortBy: "featured" }} />;
    await user.click(chip(/^Herramientas/));
    await user.click(chip(/^Kits/));
    expect(replaceState).toHaveBeenCalledTimes(2);

    // The first write reaches useSearchParams after the second one was made: keep the newer state.
    nav.searchParams = new URLSearchParams("category=herramientas");
    rerender(view());
    expect(screen.getByRole("heading", { level: 1, name: "Kits" })).toBeInTheDocument();

    nav.searchParams = new URLSearchParams("category=kits");
    rerender(view());
    expect(screen.getByRole("heading", { level: 1, name: "Kits" })).toBeInTheDocument();
    expect(replaceState).toHaveBeenCalledTimes(2);

    // Once in sync, an external change to a previously written URL is adopted again.
    nav.searchParams = new URLSearchParams("category=herramientas");
    rerender(view());
    expect(screen.getByRole("heading", { level: 1, name: "Herramientas" })).toBeInTheDocument();
    expect(replaceState).toHaveBeenCalledTimes(2);
  });

  it("never turns an unknown category from the URL into the heading", () => {
    const { rerender } = renderCatalog("category=llama-al-900123456");
    expect(screen.getByRole("heading", { level: 1, name: "Productos" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Mochila|Comida|Potabilizador/ })).toHaveLength(4);

    nav.searchParams = new URLSearchParams("category=otra-cosa-rara");
    rerender(<CatalogView products={products} initialCriteria={{ sortBy: "featured" }} />);
    expect(screen.getByRole("heading", { level: 1, name: "Productos" })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/llama|otra cosa rara/i);
  });

  it("offers the rating sorts only when some product has reviews", () => {
    const unrated = products.map((snapshot) => ({ ...snapshot, rating: null }));
    render(<CatalogView products={unrated} initialCriteria={{ sortBy: "featured" }} />);
    const options = within(screen.getByLabelText("Ordenar por")).getAllByRole("option").map((option) => option.textContent);
    expect(options).toEqual(["Destacados", "Precio: de menor a mayor", "Precio: de mayor a menor"]);
  });

  it("renders the categories as real links that filter in memory and mark the current one", async () => {
    const { user } = renderCatalog("sort=price-asc");
    expect(chip(/^Herramientas/)).toHaveAttribute("href", "/products?category=herramientas&sort=price-asc");
    expect(chip(/^Todas/)).toHaveAttribute("aria-current", "page");
    await user.click(chip(/^Herramientas/));
    expect(chip(/^Herramientas/)).toHaveAttribute("aria-current", "page");
    expect(chip(/^Todas/)).not.toHaveAttribute("aria-current");
    expect(chip(/^Todas/)).toHaveAttribute("href", "/products?sort=price-asc");
  });

  it("shows the included-in badges it is given and a quick add for single-variant products", () => {
    nav.searchParams = new URLSearchParams();
    render(
      <CatalogView products={products} initialCriteria={{ sortBy: "featured" }} includedIn={{ food: ["Kit 72h"] }} />,
    );
    const card = screen.getByRole("link", { name: "Comida de emergencia" }).closest("article")!;
    expect(within(card).getByText("Incluido en el Kit 72h")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Añadir Comida de emergencia al carrito" })).toBeInTheDocument();
    const soldOut = screen.getByRole("link", { name: "Potabilizador" }).closest("article")!;
    expect(within(soldOut).queryByRole("button")).toBeNull();
  });

  it("toggles the extra filters panel with an expanded state", async () => {
    const { user } = renderCatalog();
    const toggle = screen.getByRole("button", { name: /^Más filtros/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
