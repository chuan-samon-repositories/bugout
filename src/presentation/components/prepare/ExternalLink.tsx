import type { ReactNode } from "react";
import { ExternalLinkIcon } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import type { SourceLanguage } from "@/presentation/prepare/types";

const languageNote = messages.content.whyPrepare.card.language;

/** Link to an official page, opened in a new tab and saying so to screen readers; notes a non-Spanish page. */
export function ExternalLink({
  href,
  language = "es",
  className,
  children,
}: {
  href: string;
  language?: SourceLanguage;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      {language !== "es" && <> {languageNote[language]}</>}
      <ExternalLinkIcon className="ml-1 inline size-3.5 align-[-0.125em]" />
      <span className="sr-only"> ({messages.common.opensInNewTab})</span>
    </a>
  );
}
