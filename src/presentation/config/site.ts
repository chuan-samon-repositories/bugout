/** Public site settings. Values the business must supply come from env and are optional. */
export const siteConfig = {
  name: "Bugout",
  /** Canonical origin, used for metadata, sitemap and structured data. */
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
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
