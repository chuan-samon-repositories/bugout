import { InfoIcon, cn } from "@/presentation/components/ui";
import { formatDate, messages } from "@/presentation/i18n";
import { CONTENT_REVIEW } from "@/presentation/prepare/deck";

const copy = messages.content.whyPrepare;

/** The disclaimer, the date the content was last checked and, only once there is one, the medical reviewer. */
export function ContentNotice({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-3 rounded-2xl bg-sand-dim p-5 text-sm leading-relaxed text-ink", className)}>
      <InfoIcon className="mt-0.5 size-5 shrink-0 text-navy" />
      <div className="min-w-0 space-y-1.5">
        <p>{copy.disclaimer}</p>
        <p className="text-muted">
          {copy.sources.updated(formatDate(CONTENT_REVIEW.updatedAt))}
          {CONTENT_REVIEW.reviewer && <> {copy.sources.reviewedBy(CONTENT_REVIEW.reviewer)}</>}
        </p>
      </div>
    </div>
  );
}
