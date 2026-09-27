// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getContainer } from "@/infrastructure/config";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/presentation/context/CartContext", () => ({
  useCart: () => ({ cart: null, addItem: vi.fn(), pending: false }),
}));

import FaqPage from "./faq/page";
import HowToChoosePage from "./how-to-choose/page";
import WhyPreparePage from "./why-prepare/page";

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
  });

  it("still renders its header when the catalog is unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(getContainer().getGetProductsUseCase(), "execute").mockRejectedValueOnce(new Error("offline"));
    render(await HowToChoosePage());
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });
});

describe("/why-prepare", () => {
  it("explains why to prepare, cites official guidance without statistics and links the kits", async () => {
    render(await WhyPreparePage());
    expect(screen.getByRole("heading", { level: 1, name: "Por qué prepararse" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "Apagones y cortes de suministro",
      "Inundaciones y temporales",
      "Qué recomiendan las autoridades",
    ]);
    const official = screen.getByRole("link", { name: /Recomendaciones de Protección Civil/ });
    expect(official).toHaveAttribute("href", "https://www.proteccioncivil.es");
    expect(official).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Kit 24h" })).toHaveAttribute("href", "/products/kit-24h");
    expect(document.body).not.toHaveTextContent(/TODO/);
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

  it("promises no reply while no message reaches the shop", async () => {
    render(await FaqPage());
    expect(screen.queryByText("¿Hacéis pedidos para empresas o grupos?")).toBeNull();
  });
});
