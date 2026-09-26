export const LOCAL_SITE_URL = "http://localhost:3000";

export interface SiteUrlSources {
  /** NEXT_PUBLIC_SITE_URL: explicit canonical origin, e.g. "https://www.bugout.es". */
  siteUrl?: string;
  /** VERCEL_PROJECT_PRODUCTION_URL: production domain set by Vercel, without protocol. */
  vercelProductionUrl?: string;
}

/**
 * Canonical origin: NEXT_PUBLIC_SITE_URL, else the Vercel production domain, else localhost.
 * `configured` is false when it fell back to localhost. Trailing slashes are dropped.
 */
export function resolveSiteUrl({ siteUrl, vercelProductionUrl }: SiteUrlSources): { url: string; configured: boolean } {
  const explicit = siteUrl?.trim();
  if (explicit) return { url: explicit.replace(/\/+$/, ""), configured: true };
  const vercel = vercelProductionUrl?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (vercel) return { url: `https://${vercel}`, configured: true };
  return { url: LOCAL_SITE_URL, configured: false };
}

// Read with literal process.env names so Next.js can inline NEXT_PUBLIC_* values.
// VERCEL_* values are never inlined into client bundles: siteConfig.url is only correct on the
// server, so only use it from Server Components, route handlers and metadata functions.
const siteUrl = resolveSiteUrl({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
});

if (!siteUrl.configured && process.env.NODE_ENV === "production" && typeof window === "undefined") {
  console.warn(
    `[site] Neither NEXT_PUBLIC_SITE_URL nor VERCEL_PROJECT_PRODUCTION_URL is set: canonical, Open Graph and sitemap URLs will point to ${LOCAL_SITE_URL}.`,
  );
}

/** Public site settings. Values the business must supply come from env and are optional. */
export const siteConfig = {
  name: "Bugout",
  /** Canonical origin for metadata, sitemap, robots and structured data. Server-side only (see above). */
  url: siteUrl.url,
  /** Shown on the contact page only when configured. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
  /** Days a customer has to return an order (store policy, above the 14-day legal minimum). */
  returnWindowDays: 30,
  /** Business identity required by the LSSI; rendered only when configured. */
  legal: {
    name: process.env.NEXT_PUBLIC_LEGAL_NAME?.trim() || null,
    taxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID?.trim() || null,
    address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS?.trim() || null,
  },
} as const;
