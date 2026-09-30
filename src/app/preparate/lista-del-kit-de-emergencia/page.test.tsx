// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getContainer } from "@/infrastructure/config";

vi.mock("next/navigation", () => ({
  usePathname: () => "/preparate/lista-del-kit-de-emergencia",
  useSearchParams: () => new URLSearchParams(),
}));

import KitChecklistPage, { metadata } from "./page";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("/preparate/lista-del-kit-de-emergencia", () => {
  it("lists what to pack by situation, each line a checkbox", async () => {
    render(await KitChecklistPage());
    expect(screen.getByRole("heading", { level: 1, name: "Lista del kit de emergencia" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "Cuánta agua de beber necesitas",
      "Lo básico",
      "Si te quedas en casa",
      "Si tienes que salir de casa",
      "Para tu familia",
      "En el coche",
      "¿Prefieres tenerlo ya preparado?",
      "Fuentes",
    ]);
    const basics = screen.getByRole("region", { name: "Lo básico" });
    expect(within(basics).getByRole("checkbox", { name: /Radio de pilas o de manivela/ })).not.toBeChecked();
    expect(within(basics).getByRole("link", { name: "Radio solar" })).toHaveAttribute("href", "/products/radio-solar");
    expect(within(basics).getAllByRole("link", { name: /Luz, radio y batería/ })[0]).toHaveAttribute("href", "/preparate/luz-radio-y-bateria");
  });

  it("works out the drinking water for 1, 2 and 4 people", async () => {
    render(await KitChecklistPage());
    const table = screen.getByRole("table", { name: "Agua de beber para 72 horas" });
    expect(within(table).getAllByRole("row").slice(1).map((row) => row.textContent)).toEqual([
      "1 persona6 litros",
      "2 personas12 litros",
      "4 personas24 litros",
    ]);
  });

  it("cites its official sources and links the kits only when there are kits", async () => {
    const { unmount } = render(await KitChecklistPage());
    const sources = screen.getByRole("region", { name: "Fuentes" });
    expect(within(sources).getAllByRole("link")[0]).toHaveAttribute("href", expect.stringContaining("equip_emergencies"));
    expect(screen.getByRole("link", { name: "Comparar los kits" })).toHaveAttribute("href", "/how-to-choose");
    unmount();

    const loose = (await getContainer().getGetProductsUseCase().execute()).filter((product) => !product.details?.kit);
    vi.spyOn(getContainer().getGetProductsUseCase(), "execute").mockResolvedValueOnce(loose);
    render(await KitChecklistPage());
    expect(screen.queryByRole("link", { name: "Comparar los kits" })).toBeNull();
  });

  it("has its own search title and description", () => {
    expect(metadata.title).toBe("Lista del kit de emergencia: qué llevar");
    expect(metadata.alternates?.canonical).toBe("/preparate/lista-del-kit-de-emergencia");
    expect(metadata.openGraph).toMatchObject({ type: "article" });
  });
});
