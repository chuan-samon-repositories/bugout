// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { getContainer, resetContainer } from "@/infrastructure/config";
import { CopyrightNotice } from "./CopyrightNotice";
import { Footer } from "./Footer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const shopColumn = () => screen.getByRole("heading", { level: 2, name: "Tienda" }).parentElement!;

const renderFooter = () =>
  render(
    <Providers>
      <Footer kits={[{ slug: "kit-24h", label: "Kit 24h" }]} />
    </Providers>,
  );

describe("Footer", () => {
  beforeEach(() => {
    localStorage.clear();
    resetContainer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("leaves out the newsletter band while messaging is disabled, keeping the link columns and copyright", () => {
    expect(getContainer().isMessagingSimulated()).toBe(true);
    renderFooter();
    expect(screen.queryByRole("heading", { name: "Recibe novedades" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suscribirme" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    const columns = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(columns).toEqual(["Tienda", "Empresa", "Ayuda", "Legal"]);
    const logo = screen.getByRole("img", { name: "Bugout" });
    // Requested at its 144px display size (1x/2x), not the 790px source.
    expect(logo).toHaveAttribute("width", "144");
    expect(logo.getAttribute("srcset")).not.toMatch(/w=(640|750|828|1080|1200|1920|2048|3840)\b/);
    expect(screen.getByText("Hecho para quien no deja nada al azar.")).toBeInTheDocument();
    expect(screen.getByText(/Todos los derechos reservados/)).toBeInTheDocument();
  });

  it("offers the newsletter sign-up once messaging is enabled", () => {
    vi.spyOn(getContainer(), "isMessagingSimulated").mockReturnValue(false);
    renderFooter();
    expect(screen.getByRole("heading", { level: 2, name: "Recibe novedades" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suscribirme" })).toBeInTheDocument();
  });

  it("lists the kits, the catalog and the kit guide in the shop column", () => {
    render(
      <Providers>
        <Footer kits={[{ slug: "kit-24h", label: "Kit 24h" }]} />
      </Providers>,
    );
    const links = within(shopColumn()).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Kit 24h", "/products/kit-24h"],
      ["Productos sueltos", "/products"],
      ["Cómo elegir tu kit", "/how-to-choose"],
    ]);
  });

  it("links the help and company pages", () => {
    renderFooter();
    const footer = screen.getByRole("contentinfo");
    for (const [name, href] of [
      ["Preguntas frecuentes", "/faq"],
      ["Envíos y devoluciones", "/shipping-returns"],
      ["Por qué prepararse", "/why-prepare"],
      ["Contacto", "/contact"],
      ["Condiciones de venta", "/terms"],
    ]) {
      expect(within(footer).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(within(footer).getByRole("button", { name: "Configurar cookies" })).toBeInTheDocument();
  });
});

describe("CopyrightNotice", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves a stale prerendered year to the current one", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2031-01-02T10:00:00Z"));
    render(<CopyrightNotice renderedYear={2026} />);
    expect(screen.getByText("© 2031 Bugout. Todos los derechos reservados.")).toBeInTheDocument();
  });

  it("hydrates a build-time year without a mismatch and then shows the current year", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<CopyrightNotice renderedYear={2026} />);
    document.body.append(container);
    expect(container).toHaveTextContent("© 2026");

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2031-01-02T10:00:00Z"));
    const onRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const root = await act(async () => hydrateRoot(container, <CopyrightNotice renderedYear={2026} />, { onRecoverableError }));

    expect(container).toHaveTextContent("© 2031 Bugout. Todos los derechos reservados.");
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    act(() => root.unmount());
    consoleError.mockRestore();
    container.remove();
  });
});
