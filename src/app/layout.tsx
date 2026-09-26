import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConsentBanner } from "@/presentation/components/consent/ConsentBanner";
import { Footer } from "@/presentation/components/layout/Footer";
import { Header } from "@/presentation/components/layout/Header";
import { siteConfig } from "@/presentation/config/site";
import { HTML_LANG, messages } from "@/presentation/i18n";
import { Providers } from "./Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={HTML_LANG}>
      <body className={`${geistSans.variable} ${geistMono.variable} flex min-h-dvh flex-col font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-white px-4 py-3 font-semibold text-navy shadow-lg focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {messages.shell.skipToContent}
        </a>
        <Providers>
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
          <ConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
