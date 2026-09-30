// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { getContainer } from "@/infrastructure/config";
import { ACTION_CARDS } from "@/presentation/prepare/cards";

vi.mock("next/navigation", () => ({
  usePathname: () => "/why-prepare/hemorragia-grave",
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  permanentRedirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  },
}));

import ActionCardPage, { generateMetadata, generateStaticParams } from "./page";

const renderCard = async (slug: string) => render(await ActionCardPage({ params: Promise.resolve({ slug }) }));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("/why-prepare/[slug]", () => {
  it("shows when to call 112, the numbered steps, what not to do and why", async () => {
    await renderCard("hemorragia-grave");
    expect(screen.getByRole("heading", { level: 1, name: "Hemorragia grave" })).toBeInTheDocument();
    const call = screen.getByRole("region", { name: "Llama al 112 si" });
    expect(call).toHaveTextContent("la sangre sale a chorro o no para al apretar.");
    expect(within(call).getByRole("link", { name: "Llamar al 112" })).toHaveAttribute("href", "tel:112");
    const steps = screen.getByRole("region", { name: "Qué hacer" });
    expect(within(steps).getAllByRole("listitem")).toHaveLength(6);
    expect(within(steps).getByText(/ponlo 5-7 cm por encima de la herida/)).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "No hagas" })).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("region", { name: "Por qué" })).toHaveTextContent(/Cruz Roja aconseja apretar/);
  });

  it("links the cards its steps point to", async () => {
    await renderCard("primeros-15-minutos");
    const steps = screen.getByRole("region", { name: "Qué hacer" });
    expect(within(steps).getByRole("link", { name: /¿Me quedo o me voy\?/ })).toHaveAttribute("href", "/why-prepare/confinarse-o-evacuar");
    const seeAlso = screen.getByRole("region", { name: "Ver también" });
    expect(within(seeAlso).getAllByRole("link").length).toBeGreaterThan(0);
  });

  it("lists its official sources, opening in a new tab and noting pages in another language", async () => {
    await renderCard("rcp-adulto");
    const sources = screen.getByRole("region", { name: "Fuentes" });
    const links = within(sources).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://doi.org/10.1016/j.resuscitation.2025.110771",
      "https://www.erc.edu/science-research/guidelines/guidelines-2025/guidelines-2025-english",
      "https://www2.cruzroja.es/cursos-primeros-auxilios",
    ]);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveTextContent("se abre en una pestaña nueva");
    }
    expect(links[0]).toHaveTextContent("(en inglés)");
    expect(links[2]).not.toHaveTextContent("(en inglés)");
    expect(within(sources).getByText("Cruz Roja Española")).toBeInTheDocument();
  });

  it("says which kits include the card, from the catalog", async () => {
    await renderCard("hemorragia-grave");
    const aside = screen.getByRole("complementary", { name: "Tarjeta PA-04, Primeros auxilios" });
    expect(within(aside).getByRole("link", { name: "Kit 24h" })).toHaveAttribute("href", "/products/kit-24h");
    expect(within(aside).getByRole("link", { name: "Kit 72h" })).toHaveAttribute("href", "/products/kit-72h");
    expect(within(aside).getByRole("link", { name: "Primeros auxilios" })).toHaveAttribute("href", "/why-prepare#primeros-auxilios");
  });

  it("names only the Kit 72h for a card outside the essential deck, and no kit for an extra", async () => {
    const { unmount } = await renderCard("atragantamiento-bebe");
    const aside = screen.getByRole("complementary");
    expect(within(aside).getByRole("link", { name: "Kit 72h" })).toBeInTheDocument();
    expect(within(aside).queryByRole("link", { name: "Kit 24h" })).toBeNull();
    unmount();

    await renderCard("mascotas");
    expect(screen.queryByText(/Incluida en/)).toBeNull();
  });

  it("does not claim a kit includes the card when the catalog has no deck", async () => {
    const products = await getContainer().getGetProductsUseCase().execute();
    const withoutDecks = products.map((product) =>
      product.details?.kit?.actionCards
        ? buildProduct({ id: product.slug, name: product.name, details: { ...product.details, kit: { label: product.details.kit.label } } })
        : product,
    );
    vi.spyOn(getContainer().getGetProductsUseCase(), "execute").mockResolvedValueOnce(withoutDecks);
    await renderCard("hemorragia-grave");
    expect(screen.queryByText(/Incluida en/)).toBeNull();
  });

  it("shows the fill-in fields of the family sheet instead of steps", async () => {
    await renderCard("ficha-familiar");
    expect(screen.queryByRole("region", { name: "Qué hacer" })).toBeNull();
    expect(within(screen.getByRole("region", { name: "Qué apuntar" })).getAllByRole("listitem").length).toBeGreaterThan(5);
  });

  it("carries the disclaimer and the review date, and no reviewer while there is none", async () => {
    await renderCard("rcp-adulto");
    expect(document.body).toHaveTextContent(/No sustituye a un curso de primeros auxilios/);
    expect(document.body).toHaveTextContent("Contenido revisado el 30 de septiembre de 2026.");
    expect(document.body).not.toHaveTextContent(/Revisión sanitaria/);
  });

  it("redirects a printed card code to its page and 404s anything else", async () => {
    await expect(ActionCardPage({ params: Promise.resolve({ slug: "pa-04" }) })).rejects.toThrow(
      "NEXT_REDIRECT /why-prepare/hemorragia-grave",
    );
    await expect(ActionCardPage({ params: Promise.resolve({ slug: "PM-01" }) })).rejects.toThrow(
      "NEXT_REDIRECT /why-prepare/primeros-15-minutos",
    );
    await expect(ActionCardPage({ params: Promise.resolve({ slug: "no-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("prerenders every card and gives each its own title, description and canonical path", async () => {
    expect(generateStaticParams()).toEqual(ACTION_CARDS.map((card) => ({ slug: card.slug })));
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "apagon-prolongado" }) });
    expect(metadata.title).toBe("Qué hacer en un apagón largo");
    expect(metadata.description).toBe("Qué hacer cuando se va la luz durante horas.");
    expect(metadata.alternates?.canonical).toBe("/why-prepare/apagon-prolongado");
    expect(await generateMetadata({ params: Promise.resolve({ slug: "no-existe" }) })).toEqual({});
  });
});
