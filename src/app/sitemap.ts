import type { MetadataRoute } from "next";
import { getContainer } from "@/infrastructure/config";
import { siteConfig } from "@/presentation/config/site";
import { ACTION_CARDS } from "@/presentation/prepare/cards";
import { CONTENT_REVIEW } from "@/presentation/prepare/deck";
import { routes } from "@/presentation/routes";

/** Regenerated at most every 5 minutes so new and removed products are listed without a redeploy. */
export const revalidate = 300;

const staticPaths = [
  routes.home,
  routes.products,
  routes.howToChoose,
  routes.faq,
  routes.about,
  routes.contact,
  routes.shippingReturns,
  routes.privacy,
  routes.cookies,
  routes.terms,
];

/** The Prepárate pages change only when their content is reviewed, so they carry that date. */
const preparePaths = [routes.prepare, routes.kitChecklist, ...ACTION_CARDS.map((card) => routes.actionCard(card.slug))];

const absolute = (path: string) => new URL(path, siteConfig.url).toString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    ...staticPaths.map((path) => ({ url: absolute(path) })),
    ...preparePaths.map((path) => ({ url: absolute(path), lastModified: CONTENT_REVIEW.updatedAt })),
  ];
  try {
    const products = await getContainer().getGetProductsUseCase().execute();
    return [...entries, ...products.map((product) => ({ url: absolute(routes.product(product.slug)) }))];
  } catch (error) {
    console.warn("[sitemap] Could not load products; listing static pages only", error);
    return entries;
  }
}
