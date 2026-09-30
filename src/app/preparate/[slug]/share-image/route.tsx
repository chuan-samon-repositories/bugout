import { ACTION_CARDS } from "@/presentation/prepare/cards";
import { cardCategory } from "@/presentation/prepare/categories";
import { cardBySlug } from "@/presentation/prepare/deck";
import { renderShareImage } from "@/presentation/seo/shareImage";

/** The cards' content only changes with a deploy: every image is prerendered, unknown slugs are a 404. */
export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  return ACTION_CARDS.map((card) => ({ slug: card.slug }));
}

/**
 * Share image (Open Graph) of an action card, for links shared by WhatsApp or social media: its code, title,
 * one-line summary and category, so the preview says which card it is.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const card = cardBySlug((await params).slug);
  if (!card) return new Response(null, { status: 404 });
  return renderShareImage({
    badge: card.code,
    title: card.title,
    subtitle: card.summary,
    highlight: cardCategory(card.category).name,
  });
}
