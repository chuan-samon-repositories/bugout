// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AboutPage from "@/app/about/page";
import CookiesPage from "@/app/cookies/page";
import PrivacyPage from "@/app/privacy/page";
import ShippingReturnsPage from "@/app/shipping-returns/page";
import TermsPage from "@/app/terms/page";
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

  it("about links to the catalog and the contact page", () => {
    render(<AboutPage />);
    expect(screen.getByRole("link", { name: "Ver productos" })).toHaveAttribute("href", routes.products);
    expect(screen.getByRole("link", { name: "Contactar" })).toHaveAttribute("href", routes.contact);
  });

  it("shipping and returns quotes the pricing policy and the return window", () => {
    render(<ShippingReturnsPage />);
    expect(screen.getByRole("table", { name: "Tarifas de envío (IVA incluido)" })).toBeInTheDocument();
    expect(screen.getByText(`${siteConfig.returnWindowDays} días naturales`)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "formulario de contacto" })[0]).toHaveAttribute(
      "href",
      `${routes.contact}?topic=order`,
    );
  });

  it("privacy points to the AEPD", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("link", { name: "www.aepd.es" })).toHaveAttribute("href", "https://www.aepd.es");
  });

  it("cookies lists the storage in use and offers to change the choice", () => {
    render(<CookiesPage />);
    expect(screen.getByRole("table", { name: "Cookies y datos que guardamos en tu navegador" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cambiar preferencias de cookies" })).toBeInTheDocument();
  });
});
