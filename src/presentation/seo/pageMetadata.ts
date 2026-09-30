import type { Metadata } from "next";
import { siteConfig } from "@/presentation/config/site";
import { LOCALE, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

/** Open Graph image size recommended by Facebook, LinkedIn and X (1.91:1). */
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** Open Graph locale ("es_ES") for the storefront locale ("es-ES"). */
export const OG_LOCALE = LOCALE.replace("-", "_");

export interface ShareImage {
  /** Path or absolute URL. */
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface PageMetadataInput {
  /** Page title; the root layout appends " · Bugout" unless `absoluteTitle` is set. */
  title: string;
  description: string;
  /** The page's canonical path, e.g. routes.faq. */
  path: string;
  /** Share images; without them the site's default image (app/share-image) is used. */
  images?: readonly ShareImage[];
  /** Use `title` as is, without the site-name suffix (the home page). */
  absoluteTitle?: boolean;
  /** Keep the page out of search results. */
  noindex?: boolean;
  /** An article (the action cards) instead of a plain page, with the date it was last updated (ISO). */
  article?: { modifiedTime: string };
}

/**
 * Title, description, canonical URL and share tags (Open Graph and Twitter) for a page.
 * Every page sets its own share tags: Next.js otherwise reuses the root layout's (the home page's title and
 * description) for a page that sets only a title, and a page that sets any `openGraph` loses the layout's.
 */
/** The site's default share image. */
export const defaultShareImage = (): ShareImage => ({
  url: routes.shareImage,
  alt: messages.shell.metadata.shareImageAlt,
  ...SHARE_IMAGE_SIZE,
});

export function pageMetadata({ title, description, path, images, absoluteTitle, noindex, article }: PageMetadataInput): Metadata {
  const imageList = (images && images.length > 0 ? images : [defaultShareImage()]).map((image) => ({ ...image }));
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...(article ? { type: "article", modifiedTime: article.modifiedTime } : { type: "website" }),
      locale: OG_LOCALE,
      siteName: siteConfig.name,
      title,
      description,
      url: path,
      images: imageList,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageList.map((image) => ({ url: image.url, alt: image.alt })),
    },
    ...(noindex ? { robots: { index: false } } : {}),
  };
}
