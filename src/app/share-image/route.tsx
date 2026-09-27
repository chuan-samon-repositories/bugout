import { messages } from "@/presentation/i18n";
import { renderShareImage } from "@/presentation/seo/shareImage";

/** Rendered once at build time: the image has no data that changes. */
export const dynamic = "force-static";

/** The site's default share image (Open Graph), for every page without an image of its own (see pageMetadata). */
export function GET() {
  const copy = messages.shell.metadata;
  return renderShareImage({ title: copy.shareTitle, subtitle: copy.shareSubtitle });
}
