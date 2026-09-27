import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, posthogOrigins, robotsHeaders } from "./next.config";

const directive = (csp: string, name: string) =>
  csp
    .split("; ")
    .find((part) => part.startsWith(`${name} `))
    ?.split(" ")
    .slice(1) ?? [];

describe("contentSecurityPolicy", () => {
  it("keeps scripts and connections same-origin with the default /ingest proxy", () => {
    for (const host of [undefined, "", "/ingest"]) {
      const csp = contentSecurityPolicy({ NEXT_PUBLIC_POSTHOG_HOST: host });
      expect(directive(csp, "script-src")).toEqual(["'self'", "'unsafe-inline'"]);
      expect(directive(csp, "connect-src")).toEqual(["'self'"]);
    }
  });

  it("allows a PostHog Cloud host and its assets host for scripts and connections", () => {
    const eu = contentSecurityPolicy({ NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com" });
    for (const name of ["script-src", "connect-src"]) {
      expect(directive(eu, name)).toEqual(expect.arrayContaining(["https://eu.i.posthog.com", "https://eu-assets.i.posthog.com"]));
    }
    const us = contentSecurityPolicy({ NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com/" });
    expect(directive(us, "script-src")).toEqual(
      expect.arrayContaining(["https://us.i.posthog.com", "https://us-assets.i.posthog.com"]),
    );
  });

  it("allows a self-hosted PostHog origin without inventing an assets host", () => {
    expect(posthogOrigins("https://analytics.example.es/ingest")).toEqual(["https://analytics.example.es"]);
    expect(posthogOrigins("eu.i.posthog.com")).toEqual([]);
    expect(posthogOrigins("https://eu-assets.i.posthog.com")).toEqual(["https://eu-assets.i.posthog.com"]);
  });

  it("allows the Shopify store domain for connections only", () => {
    const csp = contentSecurityPolicy({ NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: "tienda.myshopify.com" });
    expect(directive(csp, "connect-src")).toEqual(["'self'", "https://tienda.myshopify.com"]);
    expect(directive(csp, "script-src")).toEqual(["'self'", "'unsafe-inline'"]);
  });
});

describe("robotsHeaders", () => {
  it("sends noindex on Vercel preview and development deployments", () => {
    for (const VERCEL_ENV of ["preview", "development"]) {
      expect(robotsHeaders({ VERCEL_ENV })).toEqual([{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
    }
  });

  it("sends nothing in production or off Vercel", () => {
    for (const VERCEL_ENV of ["production", undefined, ""]) {
      expect(robotsHeaders({ VERCEL_ENV })).toEqual([]);
    }
  });
});
