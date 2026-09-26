import { messages } from "@/presentation/i18n";

/** Spanish label for a category slug; unknown slugs are humanised ("camping-gear" → "Camping gear"). */
export function categoryLabel(slug: string): string {
  const known = messages.catalog.categories[slug];
  if (known) return known;
  const words = slug.replace(/[-_]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : slug;
}
