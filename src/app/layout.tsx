import type { Metadata } from "next";
import localFont from "next/font/local";
import { cache } from "react";
import "./globals.css";
import { getContainer } from "@/infrastructure/config";
import { ConsentBanner } from "@/presentation/components/consent/ConsentBanner";
import { Footer } from "@/presentation/components/layout/Footer";
import { Header } from "@/presentation/components/layout/Header";
import { navData, type NavData } from "@/presentation/components/layout/navigation";
import { siteConfig } from "@/presentation/config/site";
import { HTML_LANG, messages } from "@/presentation/i18n";
import { Providers } from "./Providers";

/**
 * The brand typeface, served from the repo (no request to Google at build or run time; CSP font-src 'self').
 * One variable file covers weights 100–900 for the Latin subset; see fonts/OFL.txt for its licence.
 */
const montserrat = localFont({
  src: "./fonts/montserrat-latin-wght-normal.woff2",
  variable: "--font-montserrat",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

const defaultTitle = messages.shell.metadata.defaultTitle;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: defaultTitle, template: `%s · ${siteConfig.name}` },
  description: messages.common.tagline,
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: siteConfig.name,
    title: defaultTitle,
    description: messages.common.tagline,
  },
};

/**
 * Kits for the header, mobile menu and footer, read from the catalog once per render
 * (React cache dedupes calls within a request). A catalog failure must not break every page,
 * so it falls back to no kits and the navigation keeps only its fixed links.
 */
const loadNavData = cache(async (): Promise<NavData> => {
  try {
    return navData(await getContainer().getGetProductsUseCase().execute());
  } catch (error) {
    console.error("Could not load the kits for the navigation", error);
    return { kits: [], flagshipSlug: null };
  }
});

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nav = await loadNavData();

  return (
    // The font variable sits on <html> because the theme's --font-sans (declared on :root) refers to it.
    <html lang={HTML_LANG} className={montserrat.variable}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-white px-4 py-3 font-semibold text-navy shadow-lg focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {messages.shell.skipToContent}
        </a>
        <Providers>
          <Header nav={nav} />
          <main id="main-content" tabIndex={-1} className="flex-1 pt-(--header-height) outline-none">
            {children}
          </main>
          <Footer kits={nav.kits} />
          <ConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
