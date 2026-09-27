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
 * Origins a PostHog host needs when it is an absolute URL (not the default same-origin /ingest proxy): the host
 * itself and, for PostHog Cloud ingestion hosts (eu.i.posthog.com, us.i.posthog.com), the matching assets host
 * the SDK loads its scripts from (eu-assets.i.posthog.com, us-assets.i.posthog.com).
 */
export function posthogOrigins(host: string | undefined): string[] {
  const trimmed = host?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return [];
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return [];
  }
  const origins = [url.origin];
  const cloud = /^([a-z0-9-]+)\.i\.posthog\.com$/i.exec(url.hostname);
  if (cloud && !cloud[1].endsWith("-assets")) origins.push(`https://${cloud[1].toLowerCase()}-assets.i.posthog.com`);
  return origins;
}

type Env = Record<string, string | undefined>;

/**
 * Content-Security-Policy for production builds (dev needs eval and websockets for Fast Refresh).
 * - Scripts: Next.js bootstraps with inline scripts and there is no nonce middleware, hence 'unsafe-inline'.
 *   PostHog's scripts load same-origin through /ingest/static and /ingest/array, or from its own hosts when
 *   NEXT_PUBLIC_POSTHOG_HOST is an absolute URL.
 * - Images: next/image serves optimised images from /_next/image; Shopify's CDN is allowed for unoptimised ones.
 * - Fonts: next/font self-hosts Montserrat.
 * - Connections: PostHog goes through the same-origin /ingest proxy unless pointed at its own host; the Shopify
 *   Storefront API is called from the browser when that provider is set up.
 */
export function contentSecurityPolicy(env: Env = process.env): string {
  const posthog = posthogOrigins(env.NEXT_PUBLIC_POSTHOG_HOST);
  const scriptSrc = ["'self'", "'unsafe-inline'", ...posthog];
  const connectSrc = ["'self'", originOf(env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN), ...posthog].filter(
    (source): source is string => source !== null,
  );

  return [
    "default-src 'self'",
    `script-src ${[...new Set(scriptSrc)].join(" ")}`,
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
