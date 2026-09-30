import { afterEach, describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/presentation/config/site";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  collectionPageJsonLd,
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

describe("articleJsonLd", () => {
  it("describes a guide by the shop with its dates, image and cited sources", () => {
    const data = articleJsonLd(
      {
        headline: "Fuga de gas en casa: qué hacer",
        description: "Si huele a gas, sal de casa.",
        path: "/preparate/fuga-de-gas",
        datePublished: "2026-09-30",
        dateModified: "2026-10-02",
        image: "/preparate/fuga-de-gas/share-image",
        citations: [{ name: "El gas, siempre con seguridad", url: "https://www.comunidad.madrid/energia", publisher: "Comunidad de Madrid" }],
      },
      origin,
    );
    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Fuga de gas en casa: qué hacer",
      description: "Si huele a gas, sal de casa.",
      url: "https://bugout.example/preparate/fuga-de-gas",
      mainEntityOfPage: "https://bugout.example/preparate/fuga-de-gas",
      inLanguage: "es-ES",
      datePublished: "2026-09-30",
      dateModified: "2026-10-02",
      image: "https://bugout.example/preparate/fuga-de-gas/share-image",
      author: { "@type": "Organization", "@id": "https://bugout.example/#organization", name: "Bugout", url: "https://bugout.example/" },
      publisher: { "@type": "Organization", "@id": "https://bugout.example/#organization", name: "Bugout", url: "https://bugout.example/" },
      isPartOf: { "@id": "https://bugout.example/#website" },
      citation: [
        {
          "@type": "CreativeWork",
          name: "El gas, siempre con seguridad",
          url: "https://www.comunidad.madrid/energia",
          publisher: { "@type": "Organization", name: "Comunidad de Madrid" },
        },
      ],
    });
  });
});

describe("collectionPageJsonLd", () => {
  it("lists the pages it links to, in order, with absolute URLs", () => {
    const data = collectionPageJsonLd(
      { name: "Prepárate", description: "Guía.", path: "/preparate", items: [{ name: "Fuga de gas", path: "/preparate/fuga-de-gas" }] },
      origin,
    );
    expect(data).toMatchObject({
      "@type": "CollectionPage",
      url: "https://bugout.example/preparate",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: 1,
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Fuga de gas", url: "https://bugout.example/preparate/fuga-de-gas" }],
      },
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
