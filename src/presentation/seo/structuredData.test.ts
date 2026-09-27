import { afterEach, describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/presentation/config/site";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  returnWindowDays,
  serializeJsonLd,
  websiteJsonLd,
} from "./structuredData";

const origin = "https://bugout.example";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("organizationJsonLd", () => {
  it("describes the online store with its logo and returns policy, without unset legal details", () => {
    const data = organizationJsonLd(origin);
    expect(data).toMatchObject({
      "@type": "OnlineStore",
      "@id": "https://bugout.example/#organization",
      name: "Bugout",
      url: "https://bugout.example/",
      logo: "https://bugout.example/images/brand/wordmark-stacked-navy.png",
      areaServed: "ES",
      hasMerchantReturnPolicy: { merchantReturnDays: 30 },
    });
    for (const key of ["legalName", "taxID", "address", "email"]) expect(data).not.toHaveProperty(key);
  });

  it("adds the seller identity and email once they are configured", () => {
    vi.spyOn(siteConfig, "legal", "get").mockReturnValue({ name: "Bugout S.L.", taxId: "B12345678", address: "Calle 1, Madrid" });
    vi.spyOn(siteConfig, "contactEmail", "get").mockReturnValue("hola@bugout.example");
    expect(organizationJsonLd(origin)).toMatchObject({
      legalName: "Bugout S.L.",
      taxID: "B12345678",
      address: "Calle 1, Madrid",
      email: "hola@bugout.example",
    });
  });
});

describe("websiteJsonLd", () => {
  it("names the site, its language and its publisher", () => {
    expect(websiteJsonLd(origin)).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://bugout.example/#website",
      name: "Bugout",
      url: "https://bugout.example/",
      inLanguage: "es-ES",
      publisher: { "@id": "https://bugout.example/#organization" },
    });
  });
});

describe("returnWindowDays", () => {
  it("is the store's window, never less than the legal withdrawal period", () => {
    expect(returnWindowDays()).toBe(30);
    // The store could offer less than 30 days; the policy never drops below the legal minimum.
    vi.spyOn(siteConfig, "returnWindowDays", "get").mockReturnValue(7 as never);
    expect(returnWindowDays()).toBe(14);
  });
});

describe("breadcrumbJsonLd", () => {
  it("lists the visible breadcrumbs with absolute URLs, the last one being the current page", () => {
    const data = breadcrumbJsonLd(
      [{ label: "Inicio", href: "/" }, { label: "Productos", href: "/products" }, { label: "Kit 72h" }],
      "/products/kit-72h",
      origin,
    );
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://bugout.example/" },
      { "@type": "ListItem", position: 2, name: "Productos", item: "https://bugout.example/products" },
      { "@type": "ListItem", position: 3, name: "Kit 72h", item: "https://bugout.example/products/kit-72h" },
    ]);
  });
});

describe("faqPageJsonLd", () => {
  it("turns questions and answers into an FAQPage", () => {
    expect(faqPageJsonLd([{ question: "¿Caduca?", answer: "Mira la fecha del envase." }])).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "¿Caduca?", acceptedAnswer: { "@type": "Answer", text: "Mira la fecha del envase." } },
      ],
    });
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so the JSON cannot close the script tag", () => {
    const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
