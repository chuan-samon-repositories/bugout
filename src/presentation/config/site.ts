/** Public site settings. Values the business must supply come from env and are optional. */
export const siteConfig = {
  name: "Bugout",
  /** Canonical origin, used for metadata, sitemap and structured data. */
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
  /** Shown on the contact page only when configured. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
} as const;
