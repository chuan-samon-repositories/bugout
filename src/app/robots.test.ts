import { afterEach, describe, expect, it, vi } from "vitest";

async function loadRobots(vercelEnv: string) {
  vi.stubEnv("VERCEL_ENV", vercelEnv);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bugout.es");
  vi.resetModules();
  const { default: robots } = await import("./robots");
  return robots();
}

describe("robots.txt", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("allows crawling and lists the sitemap in production", async () => {
    expect(await loadRobots("production")).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: "/checkout" },
      sitemap: "https://bugout.es/sitemap.xml",
    });
  });

  it("disallows everything on preview deployments such as the test site", async () => {
    expect(await loadRobots("preview")).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });
});
