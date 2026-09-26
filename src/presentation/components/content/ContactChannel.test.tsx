// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getContainer } from "@/infrastructure/config";

/** A mutable copy of the real site config, so each test can set or clear the contact email. */
const site = vi.hoisted(() => ({ contactEmail: null as string | null }));

vi.mock("@/presentation/config/site", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/presentation/config/site")>();
  return {
    ...actual,
    siteConfig: new Proxy(actual.siteConfig, {
      get: (target, key) => (key === "contactEmail" ? site.contactEmail : Reflect.get(target, key)),
    }),
  };
});

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

import AboutPage from "@/app/about/page";
import PrivacyPage from "@/app/privacy/page";
import ShippingReturnsPage from "@/app/shipping-returns/page";
import TermsPage from "@/app/terms/page";
import { ContactFaq } from "@/presentation/components/forms/ContactFaq";
import { canPromiseReply, ContactChannel } from "./ContactChannel";

const EMAIL = "hola@bugout.es";
const enableMessaging = () => vi.spyOn(getContainer(), "isMessagingSimulated").mockReturnValue(false);
const pages = [
  { name: "about", Page: AboutPage },
  { name: "shipping-returns", Page: ShippingReturnsPage },
  { name: "terms", Page: TermsPage },
  { name: "privacy", Page: PrivacyPage },
  { name: "contact FAQ", Page: () => <ContactFaq policy={getContainer().getPricingPolicy()} /> },
];

beforeEach(() => {
  site.contactEmail = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContactChannel", () => {
  it("points to the configured email, whether or not messaging is enabled", () => {
    for (const enabled of [false, true]) {
      if (enabled) enableMessaging();
      const { container, unmount } = render(
        <p>
          <ContactChannel capitalized topic="order" email={EMAIL} />.
        </p>,
      );
      expect(container).toHaveTextContent(`Escríbenos a ${EMAIL}.`);
      expect(screen.getByRole("link", { name: EMAIL })).toHaveAttribute("href", `mailto:${EMAIL}`);
      expect(screen.queryByRole("link", { name: "formulario de contacto" })).not.toBeInTheDocument();
      unmount();
    }
  });

  it("refers to the contact form (with its topic) when messaging is enabled and no email is configured", () => {
    enableMessaging();
    const { container } = render(
      <p>
        <ContactChannel topic="order" email={null} />.
      </p>,
    );
    expect(container).toHaveTextContent("escríbenos a través del formulario de contacto con el tema «Mi pedido».");
    expect(screen.getByRole("link", { name: "formulario de contacto" })).toHaveAttribute("href", "/contact?topic=order");
  });

  it("links to the contact page, without mentioning a form, when messaging is disabled and no email is configured", () => {
    expect(getContainer().isMessagingSimulated()).toBe(true);
    const { container } = render(
      <p>
        <ContactChannel capitalized topic="order" email={null} />.
      </p>,
    );
    expect(container).toHaveTextContent(/^Visita nuestra página de contacto\.$/);
    expect(screen.getByRole("link", { name: "página de contacto" })).toHaveAttribute("href", "/contact");
    expect(container).not.toHaveTextContent(/formulario|tema/);
  });

  it("promises a reply only when a message really reaches someone", () => {
    expect(canPromiseReply({ email: EMAIL, messagingEnabled: false })).toBe(true);
    expect(canPromiseReply({ email: null, messagingEnabled: true })).toBe(true);
    expect(canPromiseReply({ email: null, messagingEnabled: false })).toBe(false);
  });
});

describe("contact copy on legal and help pages", () => {
  it.each(pages)("$name: with an email, tells customers to write to it", ({ Page }) => {
    site.contactEmail = EMAIL;
    const { container } = render(<Page />);
    const mailto = screen.getAllByRole("link", { name: EMAIL });
    expect(mailto.length).toBeGreaterThan(0);
    for (const link of mailto) expect(link).toHaveAttribute("href", `mailto:${EMAIL}`);
    expect(container).toHaveTextContent(/escríbenos a hola@bugout\.es/i);
    expect(screen.queryByRole("link", { name: "formulario de contacto" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "página de contacto" })).not.toBeInTheDocument();
  });

  it.each(pages)("$name: with messaging enabled and no email, refers to the contact form", ({ Page }) => {
    enableMessaging();
    render(<Page />);
    expect(screen.getAllByRole("link", { name: "formulario de contacto" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /@/ })).not.toBeInTheDocument();
  });

  it.each(pages)("$name: with messaging disabled and no email, never mentions the form or promises a reply", ({ Page }) => {
    expect(getContainer().isMessagingSimulated()).toBe(true);
    const { container } = render(<Page />);
    expect(screen.queryByRole("link", { name: "formulario de contacto" })).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent(/formulario de contacto|formulario de esta página/i);
    expect(screen.queryByRole("link", { name: /@/ })).not.toBeInTheDocument();
    // ("Respondemos de los daños…" in the terms is legal liability, not a reply.)
    expect(container).not.toHaveTextContent(/te responderemos|te respondemos|lo solucionaremos/i);
    expect(container).not.toHaveTextContent(/escríbenos/i);
  });

  it("with messaging disabled and no email, the legal pages point to the contact page in natural sentences", () => {
    const { container, unmount } = render(<TermsPage />);
    expect(container).toHaveTextContent("Para cualquier consulta sobre la tienda o tus pedidos, visita nuestra página de contacto.");
    expect(container).toHaveTextContent(
      "Para enviarnos cualquier consulta, queja o reclamación, visita nuestra página de contacto. Las reclamaciones se atienden dentro de los plazos legales. También tienes a tu disposición hojas de reclamaciones oficiales.",
    );
    for (const link of screen.getAllByRole("link", { name: "página de contacto" })) {
      expect(link).toHaveAttribute("href", "/contact");
    }
    unmount();

    const shipping = render(<ShippingReturnsPage />);
    expect(shipping.container).toHaveTextContent(
      "Comunícanos tu decisión e indica tu número de pedido y los productos que quieres devolver: visita nuestra página de contacto.",
    );
    expect(shipping.container).toHaveTextContent(
      "Si recibes un producto dañado, defectuoso o distinto del que pediste, visita nuestra página de contacto. Estos casos",
    );
    shipping.unmount();

    const privacy = render(<PrivacyPage />);
    expect(privacy.container).toHaveTextContent(
      "Para ejercerlos, visita nuestra página de contacto. La normativa fija un plazo de un mes para atender estas solicitudes.",
    );
    privacy.unmount();

    const about = render(<AboutPage />);
    expect(about.container).toHaveTextContent(
      "Si tienes dudas sobre qué kit te conviene o necesitas ayuda con un pedido, visita nuestra página de contacto.",
    );
    expect(about.container).toHaveTextContent("Consulta el contenido de cada kit y elige el que mejor se adapta a ti.");
    expect(screen.queryByRole("link", { name: "Contactar" })).not.toBeInTheDocument();
  });

  it("the FAQ leaves out the answers that only say “write to us” while there is no channel", () => {
    render(<ContactFaq policy={getContainer().getPricingPolicy()} />);
    expect(screen.getByText("¿Puedo devolver un pedido?")).toBeInTheDocument();
    expect(screen.getByText("¿Los precios incluyen IVA?")).toBeInTheDocument();
    expect(screen.queryByText("¿Hacéis pedidos para empresas o grupos?")).not.toBeInTheDocument();
    expect(screen.queryByText("¿Cómo consulto el estado de mi pedido?")).not.toBeInTheDocument();
  });

  it("the FAQ answers wholesale and order-status questions through the channel that exists", () => {
    site.contactEmail = EMAIL;
    const { container, unmount } = render(<ContactFaq policy={getContainer().getPricingPolicy()} />);
    expect(container).toHaveTextContent(
      `Sí. Escríbenos a ${EMAIL} y cuéntanos qué necesitas y cuántas unidades. Te responderemos por correo.`,
    );
    expect(container).toHaveTextContent(`Escríbenos a ${EMAIL} e indica el número de pedido`);
    unmount();

    site.contactEmail = null;
    enableMessaging();
    const connected = render(<ContactFaq policy={getContainer().getPricingPolicy()} />);
    expect(connected.container).toHaveTextContent(
      "Sí. Escríbenos a través del formulario de contacto con el tema «Empresas y pedidos para grupos» y cuéntanos qué necesitas y cuántas unidades.",
    );
    const formLinks = screen.getAllByRole("link", { name: "formulario de contacto" });
    expect(formLinks.map((link) => link.getAttribute("href"))).toEqual(["/contact?topic=wholesale", "/contact?topic=order"]);
  });

  it("promises a reply once messaging is connected, even without an email", () => {
    enableMessaging();
    const { container } = render(<AboutPage />);
    expect(container).toHaveTextContent(
      "escríbenos a través del formulario de contacto y te responderemos personalmente.",
    );
    expect(screen.getByRole("link", { name: "Contactar" })).toHaveAttribute("href", "/contact");
    render(<ShippingReturnsPage />);
    expect(screen.getByText(/Te responderemos con las instrucciones/)).toBeInTheDocument();
  });

  it("promises a reply when an email is configured, even while messaging is disabled", () => {
    site.contactEmail = EMAIL;
    const { container, unmount } = render(<PrivacyPage />);
    expect(container).toHaveTextContent(`Para ejercerlos, escríbenos a ${EMAIL}. Te responderemos en el plazo de un mes.`);
    unmount();
    render(<AboutPage />);
    expect(screen.getByRole("link", { name: "Contactar" })).toHaveAttribute("href", "/contact");
  });
});
