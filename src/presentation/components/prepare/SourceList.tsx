import { cn, focusRing } from "@/presentation/components/ui";
import type { Source } from "@/presentation/prepare/types";
import { ExternalLink } from "./ExternalLink";

export const sourceLinkClasses = cn(
  "rounded-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-hover",
  focusRing,
);

/** The official pages a card is based on: organisation, then the page title as a link. */
export function SourceList({ sources, className }: { sources: readonly Source[]; className?: string }) {
  return (
    <ul className={cn("space-y-3 text-sm leading-snug", className)}>
      {sources.map((source) => (
        <li key={source.url}>
          <span className="block text-xs font-bold tracking-wide text-muted uppercase">{source.organisation}</span>
          <ExternalLink href={source.url} language={source.language} className={sourceLinkClasses}>
            {source.title}
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
}
