import { describe, expect, it } from "vitest";
import { pageMetadata } from "./pageMetadata";

describe("pageMetadata", () => {
  it("sets the canonical URL and share tags of the page itself", () => {
    const metadata = pageMetadata({ title: "Preguntas frecuentes", description: "Dudas habituales.", path: "/faq" });
    expect(metadata.title).toBe("Preguntas frecuentes");
    expect(metadata.description).toBe("Dudas habituales.");
    expect(metadata.alternates).toEqual({ canonical: "/faq" });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      locale: "es_ES",
      siteName: "Bugout",
      title: "Preguntas frecuentes",
      description: "Dudas habituales.",
      url: "/faq",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: "Preguntas frecuentes" });
    expect(metadata.robots).toBeUndefined();
  });

  it("falls back to the site's default share image", () => {
    const metadata = pageMetadata({ title: "T", description: "D", path: "/about" });
    expect(metadata.openGraph?.images).toEqual([
      { url: "/share-image", alt: "Bugout: kits de emergencia de 24 y 72 horas", width: 1200, height: 630 },
    ]);
    expect(metadata.twitter?.images).toEqual([{ url: "/share-image", alt: "Bugout: kits de emergencia de 24 y 72 horas" }]);
  });

  it("uses the page's own images when it has them", () => {
    const images = [{ url: "/images/products/manta.jpg", alt: "Manta", width: 900, height: 900 }];
    const metadata = pageMetadata({ title: "Manta", description: "D", path: "/products/manta", images });
    expect(metadata.openGraph?.images).toEqual(images);
  });

  it("marks an article with the date it was last updated, and plain pages as websites", () => {
    const article = pageMetadata({ title: "T", description: "D", path: "/preparate/x", article: { modifiedTime: "2026-09-30" } });
    expect(article.openGraph).toMatchObject({ type: "article", modifiedTime: "2026-09-30" });
    expect(pageMetadata({ title: "T", description: "D", path: "/about" }).openGraph).toMatchObject({ type: "website" });
  });

  it("can skip the site-name suffix and keep a page out of search results", () => {
    const metadata = pageMetadata({ title: "Inicio", description: "D", path: "/", absoluteTitle: true, noindex: true });
    expect(metadata.title).toEqual({ absolute: "Inicio" });
    expect(metadata.robots).toEqual({ index: false });
  });
});
