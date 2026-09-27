// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getContainer } from "@/infrastructure/config";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/presentation/context/AnalyticsContext", () => ({
  useAnalytics: () => ({ track: vi.fn(), captureException: vi.fn(), setConsent: vi.fn() }),
}));

vi.mock("@/presentation/context/CartContext", () => ({
  useCart: () => ({ cart: null, addItem: vi.fn(), pending: false }),
}));

import HomePage from "./page";

const NEWSLETTER_TITLE = "Consejos de preparación en tu correo";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("home page", () => {
  it("leaves out the newsletter section while messaging is disabled", async () => {
    expect(getContainer().isMessagingSimulated()).toBe(true);
    render(await HomePage());
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: NEWSLETTER_TITLE })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suscribirme" })).not.toBeInTheDocument();
  });

  it("renders the partner design's sections from the catalog", async () => {
    render(await HomePage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Porque una emergencia no avisa.");
    expect(screen.getByRole("link", { name: "Kit 24h" })).toHaveAttribute("href", "/products/kit-24h");
    expect(screen.getByRole("link", { name: "Kit 72h" })).toHaveAttribute("href", "/products/kit-72h");
    for (const title of [
      "Elige según el tiempo que necesites aguantar",
      "¿Qué diferencias hay?",
      "El contenido, desplegado",
      "Las emergencias no avisan",
      "Completa o renueva tu kit",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
    }
    const kits = screen.getByRole("region", { name: "Elige según el tiempo que necesites aguantar" });
    expect(within(kits).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Kit 24h",
      "Kit 72h",
      "Kit Custom",
    ]);
    expect(within(kits).getByRole("link", { name: "Ver el kit: Kit 72h" })).toHaveAttribute("href", "/products/kit-72h");
    const table = screen.getByRole("table", { name: "Comparativa de los kits" });
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Característica",
      "Kit 24h",
      "Kit 72h",
    ]);
    expect(within(table).getByRole("row", { name: /Personas/ })).toHaveTextContent("1, 2 o 4");
    const inside = screen.getByRole("region", { name: "El contenido, desplegado" });
    const radio = within(inside).getByRole("link", { name: "Radio solar" });
    expect(radio).toHaveAttribute("href", "/products/radio-solar");
    // The thumbnail is decorative: its alt would only repeat the label.
    expect(within(radio).queryByRole("img")).toBeNull();
    const trust = screen.getByRole("region", { name: "Comprar en Bugout" });
    expect(trust).toHaveTextContent("Envío gratis desde 75,00 €");
    expect(trust).toHaveTextContent("Península y Baleares");
    expect(trust).toHaveTextContent("Caducidad a la vista");
    expect(trust).not.toHaveTextContent(/te avisamos/i);
    expect(trust).not.toHaveTextContent(/garant|24–48/i);
  });

  it("shows the newsletter section once messaging is enabled", async () => {
    vi.spyOn(getContainer(), "isMessagingSimulated").mockReturnValue(false);
    render(await HomePage());
    expect(screen.getByRole("region", { name: NEWSLETTER_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suscribirme" })).toBeInTheDocument();
  });
});
