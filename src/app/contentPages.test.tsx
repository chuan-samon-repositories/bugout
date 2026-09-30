// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { getContainer } from "@/infrastructure/config";
import { ACTION_CARDS } from "@/presentation/prepare/cards";
import { CARD_CATEGORIES } from "@/presentation/prepare/categories";
import { deckCards } from "@/presentation/prepare/deck";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/presentation/context/CartContext", () => ({
  useCart: () => ({ cart: null, addItem: vi.fn(), pending: false }),
}));

import FaqPage from "./faq/page";
import HowToChoosePage from "./how-to-choose/page";
import WhyPreparePage from "./preparate/page";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("/how-to-choose", () => {
  it("compares the comparable kits, says who each kit is for and links every kit", async () => {
    render(await HowToChoosePage());
    expect(screen.getByRole("heading", { level: 1, name: "Cómo elegir tu kit" })).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Comparativa de los kits" });
    expect(within(table).getAllByRole("columnheader").slice(1).map((cell) => cell.textContent)).toEqual(["Kit 24h", "Kit 72h"]);
    expect(within(table).getByRole("row", { name: /Caducidad de los consumibles/ })).toBeInTheDocument();
    const forWhom = screen.getByRole("region", { name: "Para quién es cada kit" });
    expect(within(forWhom).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Kit 24h",
      "Kit 72h",
      "Kit Custom",
    ]);
    expect(screen.getByRole("link", { name: "Ver el kit: Kit Custom" })).toHaveAttribute("href", "/products/kit-custom");
    expect(screen.queryByRole("region", { name: "Estamos preparando los kits" })).toBeNull();
  });

  it("points to the catalog when there are no kits", async () => {
    const loose = (await getContainer().getGetProductsUseCase().execute()).filter((product) => !product.details?.kit);
    vi.spyOn(getContainer().getGetProductsUseCase(), "execute").mockResolvedValueOnce(loose);
    render(await HowToChoosePage());
    const empty = screen.getByRole("region", { name: "Estamos preparando los kits" });
    expect(within(empty).getByRole("link", { name: "Ver los productos" })).toHaveAttribute("href", "/products");
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("still renders its header when the catalog is unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(getContainer().getGetProductsUseCase(), "execute").mockRejectedValueOnce(new Error("offline"));
    render(await HowToChoosePage());
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });
});

describe("/preparate", () => {
  it("guides the visitor from the emergency now to preparing, the cards and their sources", async () => {
    render(await WhyPreparePage());
    expect(screen.getByRole("heading", { level: 1, name: "Prepárate para una emergencia" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "Si la emergencia es ahora",
      "Las emergencias más habituales no son de película",
      "Prepárate en 5 pasos",
      "Tarjetas de acción",
      "La misma guía, en papel",
      "Fuentes oficiales",
      "Elige tu kit",
    ]);
    expect(screen.getByRole("link", { name: "Ver los primeros 15 minutos" })).toHaveAttribute(
      "href",
      "/preparate/primeros-15-minutos",
    );
    expect(screen.getByRole("link", { name: "112" })).toHaveAttribute("href", "tel:112");
    expect(screen.getByRole("link", { name: "91 562 04 20" })).toHaveAttribute("href", "tel:+34915620420");
    expect(screen.getByRole("link", { name: "Kit 24h" })).toHaveAttribute("href", "/products/kit-24h");
    expect(document.body).not.toHaveTextContent(/TODO/);
  });

  it("lists the 5 steps, each with its cards and an official source", async () => {
    render(await WhyPreparePage());
    const steps = screen.getByRole("region", { name: "Prepárate en 5 pasos" });
    expect(within(steps).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Infórmate",
      "Haz tu plan familiar",
      "Prepara tu kit",
      "Aprende primeros auxilios",
      "Revisa y practica",
    ]);
    for (const item of within(steps).getAllByRole("listitem").filter((li) => li.parentElement?.tagName === "OL")) {
      expect(within(item).getAllByRole("link").some((link) => link.getAttribute("href")?.startsWith("/preparate/"))).toBe(true);
      const external = within(item).getAllByRole("link").filter((link) => link.getAttribute("target") === "_blank");
      expect(external.length).toBeGreaterThan(0);
      for (const link of external) expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it('sends the "Prepara tu kit" step to the kit checklist and the kits', async () => {
    render(await WhyPreparePage());
    const steps = screen.getByRole("region", { name: "Prepárate en 5 pasos" });
    expect(within(steps).getByRole("link", { name: /Ver la lista del kit de emergencia/ })).toHaveAttribute(
      "href",
      "/preparate/lista-del-kit-de-emergencia",
    );
    expect(within(steps).getByRole("link", { name: /Ver los kits/ })).toHaveAttribute("href", "/how-to-choose");
  });

  it("describes itself as a collection of every card", async () => {
    render(await WhyPreparePage());
    const collection = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .flatMap((script) => [JSON.parse(script.textContent ?? "null")].flat())
      .find((data) => data["@type"] === "CollectionPage");
    expect(collection.mainEntity.numberOfItems).toBe(ACTION_CARDS.length);
    expect(collection.name).toBe("Prepárate para una emergencia");
  });

  it("groups every card by category, with jump links to each", async () => {
    render(await WhyPreparePage());
    const cards = screen.getByRole("region", { name: "Tarjetas de acción" });
    const jump = within(cards).getByRole("navigation", { name: "Categorías de tarjetas" });
    expect(within(jump).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual(
      CARD_CATEGORIES.map((category) => [category.name, `#${category.anchor}`]),
    );
    for (const category of CARD_CATEGORIES) {
      const group = within(cards).getByRole("region", { name: new RegExp(`^${category.name}`) });
      expect(group).toHaveAttribute("id", category.anchor);
      const count = ACTION_CARDS.filter((card) => card.category === category.id).length;
      expect(within(group).getAllByRole("link")).toHaveLength(count);
    }
    expect(within(cards).getByRole("link", { name: /Hemorragia grave/ })).toHaveAttribute("href", "/preparate/hemorragia-grave");
  });

  it("says which deck each kit carries, with counts from the catalog", async () => {
    render(await WhyPreparePage());
    const deck = screen.getByRole("region", { name: "La misma guía, en papel" });
    expect(within(deck).getByRole("link", { name: `El Kit 24h incluye ${deckCards("essential").length} tarjetas` })).toHaveAttribute(
      "href",
      "/products/kit-24h",
    );
    expect(within(deck).getByRole("link", { name: `El Kit 72h incluye ${deckCards("complete").length} tarjetas` })).toHaveAttribute(
      "href",
      "/products/kit-72h",
    );
    expect(within(deck).queryByText(/Kit Custom/)).toBeNull();
  });

  it("never says a kit includes the cards when the catalog does not", async () => {
    const products = await getContainer().getGetProductsUseCase().execute();
    const withoutDecks = products.map((product) =>
      product.details?.kit?.actionCards
        ? buildProduct({ id: product.slug, name: product.name, details: { ...product.details, kit: { label: product.details.kit.label } } })
        : product,
    );
    vi.spyOn(getContainer().getGetProductsUseCase(), "execute").mockResolvedValueOnce(withoutDecks);
    render(await WhyPreparePage());
    expect(screen.queryByText(/incluye \d+ tarjetas/)).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Cómo leer las tarjetas" })).toBeInTheDocument();
  });

  it("names its sources and the review date, and claims no medical review", async () => {
    render(await WhyPreparePage());
    const sources = screen.getByRole("region", { name: "Fuentes oficiales" });
    expect(within(sources).getByText("Cruz Roja Española")).toBeInTheDocument();
    expect(within(sources).getByText("European Resuscitation Council (ERC)")).toBeInTheDocument();
    expect(within(sources).getByRole("link", { name: /busca un curso de Cruz Roja/ })).toHaveAttribute(
      "href",
      "https://www2.cruzroja.es/cursos-primeros-auxilios",
    );
    expect(sources).toHaveTextContent("Contenido revisado el 30 de septiembre de 2026.");
    expect(sources).toHaveTextContent(/No sustituye a un curso de primeros auxilios/);
    expect(document.body).not.toHaveTextContent(/Revisión sanitaria/);
  });
});

describe("/faq", () => {
  it("answers kit questions from the catalog and keeps the order questions", async () => {
    render(await FaqPage());
    expect(screen.getByRole("heading", { level: 1, name: "Preguntas frecuentes" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "Sobre los kits",
      "Pedidos, envíos y devoluciones",
    ]);
    expect(screen.getByText(/El Kit 24h y el Kit 72h se venden para 1, 2 o 4 personas/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver el Kit Custom" })).toHaveAttribute("href", "/products/kit-custom");
    expect(screen.getByText("¿Puedo devolver un pedido?")).toBeInTheDocument();
  });

  it("describes the visible questions as FAQPage structured data", async () => {
    const { container } = render(await FaqPage());
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.textContent ?? "{}");
    expect(data["@type"]).toBe("FAQPage");
    const questions = data.mainEntity.map((entry: { name: string }) => entry.name);
    expect(questions).toContain("¿Puedo comprar un kit para toda la familia?");
    expect(questions).toContain("¿Puedo devolver un pedido?");
    // Every question in the data is one the page shows.
    for (const question of questions) expect(screen.getByText(question)).toBeInTheDocument();
    const shipping = data.mainEntity.find((entry: { name: string }) => entry.name === "¿A dónde enviáis y cuánto tarda?");
    expect(shipping.acceptedAnswer.text).toMatch(/^Enviamos a la España peninsular y a las islas Baleares\..*gratis a partir de 75,00\s€/);
  });

  it("promises no reply while no message reaches the shop", async () => {
    render(await FaqPage());
    expect(screen.queryByText("¿Hacéis pedidos para empresas o grupos?")).toBeNull();
  });
});
