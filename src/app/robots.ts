import type { MetadataRoute } from "next";
import { siteConfig } from "@/presentation/config/site";
import { routes } from "@/presentation/routes";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: routes.checkout },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
