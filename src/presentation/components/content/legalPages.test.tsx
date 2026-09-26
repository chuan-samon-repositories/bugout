// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AboutPage from "@/app/about/page";
import CookiesPage from "@/app/cookies/page";
import PrivacyPage from "@/app/privacy/page";
import ShippingReturnsPage from "@/app/shipping-returns/page";
import TermsPage from "@/app/terms/page";
import { getContainer } from "@/infrastructure/config";
import { siteConfig } from "@/presentation/config/site";
import { routes } from "@/presentation/routes";

vi.mock("@/presentation/context/AnalyticsContext", () => ({
  useConsent: () => ({
    decision: null,
    ready: true,
    accept: vi.fn(),
    reject: vi.fn(),
    reopen: vi.fn(),
    dismiss: vi.fn(),
    isBannerOpen: false,
    reopenRequest: 0,
  }),
}));

const pages = [
  { name: "about", Page: AboutPage, title: "Sobre nosotros" },
  { name: "shipping-returns", Page: ShippingReturnsPage, title: "Envíos y devoluciones" },
  { name: "terms", Page: TermsPage, title: "Condiciones de venta" },
  { name: "privacy", Page: PrivacyPage, title: "Política de privacidad" },
  { name: "cookies", Page: CookiesPage, title: "Política de cookies" },
];

describe("content pages", () => {
  it.each(pages)("$name renders exactly one h1 and no <main>", ({ Page, title }) => {
    const { container } = render(<Page />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(title);
    expect(container.querySelector("main")).toBeNull();
  });

  it("about links to the catalog (the “Contactar” button needs a contact channel, see ContactChannel.test)", () => {
    render(<AboutPage />);
    expect(screen.getByRole("link", { name: "Ver productos" })).toHaveAttribute("href", routes.products);
    expect(screen.queryByRole("link", { name: "Contactar" })).not.toBeInTheDocument();
  });

  it("shipping and returns quotes the pricing policy and the return window", () => {
    render(<ShippingReturnsPage />);
    expect(screen.getByRole("table", { name: "Tarifas de envío (IVA incluido)" })).toBeInTheDocument();
    expect(screen.getByText(`${siteConfig.returnWindowDays} días naturales`)).toBeInTheDocument();
    // Default build: no email and messaging disabled, so the contact page is the only reference.
    expect(screen.getAllByRole("link", { name: "página de contacto" })[0]).toHaveAttribute("href", routes.contact);
  });

  it("privacy points to the AEPD", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("link", { name: "www.aepd.es" })).toHaveAttribute("href", "https://www.aepd.es");
  });

  it("privacy describes the newsletter and contact form only while messaging is enabled", () => {
    const { unmount } = render(<PrivacyPage />);
    expect(screen.getByRole("heading", { level: 3, name: "Pedidos y compras" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Analítica web" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: "Formulario de contacto" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: "Newsletter" })).not.toBeInTheDocument();
    expect(screen.queryByText(/newsletter/i)).not.toBeInTheDocument();
    unmount();

    vi.spyOn(getContainer(), "isMessagingSimulated").mockReturnValue(false);
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { level: 3, name: "Formulario de contacto" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Newsletter" })).toBeInTheDocument();
    expect(screen.queryByText(/todavía no están conectados/)).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("cookies lists the storage in use and offers to change the choice", () => {
    render(<CookiesPage />);
    expect(screen.getByRole("table", { name: "Cookies y datos que guardamos en tu navegador" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cambiar preferencias de cookies" })).toBeInTheDocument();
  });
});
