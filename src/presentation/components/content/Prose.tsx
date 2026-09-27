import type { ReactNode } from "react";
import { cn } from "@/presentation/components/ui";

const proseClasses = cn(
  "max-w-[47.5rem] min-w-0 break-words text-base leading-7 text-muted",
  "[&_h2]:mt-10 [&_h2]:mb-3.5 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:text-navy-deep",
  "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:scroll-mt-24 [&_h3]:text-lg [&_h3]:text-navy-deep",
  "[&>h2:first-child]:mt-0 [&_p]:my-4",
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6",
  "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
  "[&_li]:pl-1 [&_strong]:font-bold [&_strong]:text-navy-deep [&_code]:rounded [&_code]:bg-sand-dim [&_code]:px-1 [&_code]:font-mono [&_code]:text-ink",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm",
  "[&_a]:rounded-sm [&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4",
  "[&_a:hover]:text-accent-hover [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-accent",
);

export interface ProseProps {
  children: ReactNode;
  className?: string;
}

/** Readable long-form text column. Style plain elements (h2, h3, p, lists, tables, links); keep buttons outside. */
export function Prose({ children, className }: ProseProps) {
  return <div className={cn(proseClasses, className)}>{children}</div>;
}
