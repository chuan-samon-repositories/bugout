import type { MetadataRoute } from "next";
import { getContainer } from "@/infrastructure/config";
import { siteConfig } from "@/presentation/config/site";
import { routes } from "@/presentation/routes";

/** Regenerated at most every 5 minutes so new and removed products are listed without a redeploy. */
export const revalidate = 300;

const staticPaths = [
  routes.home,
  routes.products,
  routes.howToChoose,
  routes.whyPrepare,
  routes.faq,
  routes.about,
  routes.contact,
  routes.shippingReturns,
  routes.privacy,
  routes.cookies,
  routes.terms,
];

const absolute = (path: string) => new URL(path, siteConfig.url).toString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({ url: absolute(path) }));
  try {
    const products = await getContainer().getGetProductsUseCase().execute();
    return [...entries, ...products.map((product) => ({ url: absolute(routes.product(product.slug)) }))];
  } catch (error) {
    console.warn("[sitemap] Could not load products; listing static pages only", error);
    return entries;
  }
}
