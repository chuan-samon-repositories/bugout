import type { ReactNode } from "react";
import { cn } from "@/presentation/components/ui";

const proseClasses = cn(
  "max-w-3xl min-w-0 break-words text-base leading-7 text-ink",
  "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:scroll-mt-20 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink",
  "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:scroll-mt-20 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink",
  "[&>h2:first-child]:mt-0 [&_p]:my-4",
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6",
  "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
  "[&_li]:pl-1 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-sand/60 [&_code]:px-1 [&_code]:font-mono",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm",
  "[&_a]:rounded-sm [&_a]:font-medium [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4",
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
