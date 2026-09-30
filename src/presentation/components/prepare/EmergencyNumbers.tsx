import { cn, PhoneIcon } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { SOURCES } from "@/presentation/prepare/sources";
import { ExternalLink } from "./ExternalLink";
import { sourceLinkClasses } from "./SourceList";

const copy = messages.content.whyPrepare.emergencyNumbers;

/** 112 and the poison information line, tap-to-call, each with its official source. */
export function EmergencyNumbers({ className }: { className?: string }) {
  return (
    <section aria-labelledby="emergency-numbers-title" className={cn("rounded-2xl bg-white p-6 shadow-card", className)}>
      <h3 id="emergency-numbers-title" className="mb-4 text-lg text-navy-deep">
        {copy.title}
      </h3>
      <ul className="space-y-4">
        {copy.items.map((item) => {
          const source = SOURCES[item.source];
          return (
            <li key={item.number} className="flex gap-3">
              <PhoneIcon className="mt-1 size-5 shrink-0 text-danger" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-muted">{item.label}</p>
                <a
                  href={`tel:${item.tel}`}
                  className="rounded-sm text-2xl font-bold text-navy-deep tabular-nums hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  {item.number}
                </a>
                <p className="text-sm text-muted">
                  {item.detail}{" "}
                  <ExternalLink href={source.url} language={source.language} className={sourceLinkClasses}>
                    {copy.sourceLink}
                    <span className="sr-only">: {source.organisation}</span>
                  </ExternalLink>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
