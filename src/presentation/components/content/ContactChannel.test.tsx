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
  it("points to the configured email", () => {
    const { container } = render(
      <p>
        <ContactChannel capitalized topic="order" email={EMAIL} />.
      </p>,
    );
    expect(container).toHaveTextContent(`Escríbenos a ${EMAIL}.`);
    expect(screen.getByRole("link", { name: EMAIL })).toHaveAttribute("href", `mailto:${EMAIL}`);
    expect(screen.queryByRole("link", { name: "formulario de contacto" })).not.toBeInTheDocument();
  });

  it("refers to the contact form (with its topic) when no email is configured", () => {
    const { container } = render(
      <p>
        <ContactChannel topic="order" email={null} />.
      </p>,
    );
    expect(container).toHaveTextContent("escríbenos a través del formulario de contacto con el tema «Mi pedido».");
    expect(screen.getByRole("link", { name: "formulario de contacto" })).toHaveAttribute("href", "/contact?topic=order");
  });

  it("promises a reply only when a message really reaches someone", () => {
    expect(canPromiseReply({ email: EMAIL, messagingSimulated: true })).toBe(true);
    expect(canPromiseReply({ email: null, messagingSimulated: false })).toBe(true);
    expect(canPromiseReply({ email: null, messagingSimulated: true })).toBe(false);
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
  });

  it.each(pages)("$name: without an email, refers to the contact form", ({ Page }) => {
    render(<Page />);
    expect(screen.getAllByRole("link", { name: "formulario de contacto" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /@/ })).not.toBeInTheDocument();
  });

  it.each(pages)("$name: simulated messaging and no email never promises a reply", ({ Page }) => {
    expect(getContainer().isMessagingSimulated()).toBe(true);
    const { container } = render(<Page />);
    // ("Respondemos de los daños…" in the terms is legal liability, not a reply.)
    expect(container).not.toHaveTextContent(/te responderemos|te respondemos|lo solucionaremos/i);
  });

  it("promises a reply once messaging is connected, even without an email", () => {
    vi.spyOn(getContainer(), "isMessagingSimulated").mockReturnValue(false);
    const { container } = render(<AboutPage />);
    expect(container).toHaveTextContent(
      "escríbenos a través del formulario de contacto y te responderemos personalmente.",
    );
    render(<ShippingReturnsPage />);
    expect(screen.getByText(/Te responderemos con las instrucciones/)).toBeInTheDocument();
  });

  it("promises a reply when an email is configured, even while the form is simulated", () => {
    site.contactEmail = EMAIL;
    const { container } = render(<PrivacyPage />);
    expect(container).toHaveTextContent(`Para ejercerlos, escríbenos a ${EMAIL}. Te responderemos en el plazo de un mes.`);
  });
});
