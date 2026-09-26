import type { NextConfig } from "next";

/** Origin of an absolute http(s) URL or bare host ("shop.myshopify.com"), or null. */
function originOf(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith("/")) return null;
  try {
    const url = new URL(/^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Content-Security-Policy for production builds (dev needs eval and websockets for Fast Refresh).
 * - Scripts: Next.js bootstraps with inline scripts and there is no nonce middleware, hence 'unsafe-inline'.
 * - Images: next/image serves optimised images from /_next/image; Shopify's CDN is allowed for unoptimised ones.
 * - Fonts: next/font self-hosts Geist.
 * - Connections: PostHog goes through the same-origin /ingest proxy (its scripts via /ingest/static and
 *   /ingest/array); the Shopify Storefront API is called from the browser when that provider is set up.
 */
function contentSecurityPolicy(): string {
  const connectSrc = [
    "'self'",
    originOf(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN),
    // Only when PostHog is pointed at its own host instead of the /ingest proxy.
    originOf(process.env.NEXT_PUBLIC_POSTHOG_HOST),
  ].filter((source): source is string => source !== null);

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://cdn.shopify.com",
    "font-src 'self'",
    `connect-src ${[...new Set(connectSrc)].join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Browsers ignore HSTS over plain http (e.g. localhost), so it is safe to send everywhere.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy() }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Product photos come from Shopify's CDN when the Shopify provider is active.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com", pathname: "/**" }],
  },
  // PostHog calls its API with trailing slashes; don't redirect them.
  skipTrailingSlashRedirect: true,
  // Reverse proxy for PostHog (EU) so analytics requests stay first-party. Order matters.
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://eu-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/array/:path*", destination: "https://eu-assets.i.posthog.com/array/:path*" },
      { source: "/ingest/:path*", destination: "https://eu.i.posthog.com/:path*" },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
