import { afterEach, describe, expect, it, vi } from "vitest";
import { isIndexableDeployment, LOCAL_SITE_URL, resolveSiteUrl } from "./site";

describe("resolveSiteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL and drops trailing slashes", () => {
    expect(resolveSiteUrl({ siteUrl: " https://www.bugout.es/ ", vercelProductionUrl: "bugout.vercel.app" })).toEqual({
      url: "https://www.bugout.es",
      configured: true,
    });
  });

  it("adds https:// to a NEXT_PUBLIC_SITE_URL without protocol, like the Vercel fallback", () => {
    expect(resolveSiteUrl({ siteUrl: "bugout.es" })).toEqual({ url: "https://bugout.es", configured: true });
    expect(resolveSiteUrl({ siteUrl: " www.bugout.es/ " })).toEqual({ url: "https://www.bugout.es", configured: true });
    expect(resolveSiteUrl({ siteUrl: "http://localhost:3000" }).url).toBe("http://localhost:3000");
    expect(() => new URL(resolveSiteUrl({ siteUrl: "bugout.es" }).url)).not.toThrow();
  });

  it("falls back to the Vercel production domain over https", () => {
    expect(resolveSiteUrl({ siteUrl: "", vercelProductionUrl: "bugout.vercel.app" })).toEqual({
      url: "https://bugout.vercel.app",
      configured: true,
    });
  });

  it("uses localhost when nothing is configured", () => {
    expect(resolveSiteUrl({})).toEqual({ url: LOCAL_SITE_URL, configured: false });
  });
});

describe("isIndexableDeployment", () => {
  it("is indexable in production and off Vercel", () => {
    expect(isIndexableDeployment("production")).toBe(true);
    expect(isIndexableDeployment(undefined)).toBe(true);
    expect(isIndexableDeployment("")).toBe(true);
  });

  it("is not indexable on preview and development deployments", () => {
    expect(isIndexableDeployment("preview")).toBe(false);
    expect(isIndexableDeployment("development")).toBe(false);
  });
});

describe("siteConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("warns once in production when the canonical origin falls back to localhost", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.resetModules();
    const { siteConfig } = await import("./site");
    expect(siteConfig.url).toBe(LOCAL_SITE_URL);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain("localhost");
  });

  it("uses the Vercel domain in production without warning", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "bugout.vercel.app");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.resetModules();
    const { siteConfig } = await import("./site");
    expect(siteConfig.url).toBe("https://bugout.vercel.app");
    expect(warn).not.toHaveBeenCalled();
  });
});
