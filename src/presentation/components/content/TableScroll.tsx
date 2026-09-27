import type { ReactNode } from "react";
import { cn, focusRing } from "@/presentation/components/ui";

export interface TableScrollProps {
  /** Accessible name of the scrollable region (keyboard users can focus it to scroll). */
  label: string;
  children: ReactNode;
  className?: string;
}

/** Lets a wide table scroll horizontally on small screens instead of overflowing the page. */
export function TableScroll({ label, children, className }: TableScrollProps) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn("my-6 max-w-full overflow-x-auto rounded-xl border border-sand-line bg-white", focusRing, className)}
    >
      {children}
    </div>
  );
}

export const tableClasses = {
  table: "w-full min-w-[36rem] border-collapse text-left text-sm",
  caption: "px-4 py-3 text-left text-base font-bold text-navy-deep",
  headCell: "border-b border-sand-line bg-navy px-4 py-3 font-bold text-sand",
  rowHeader: "border-t border-sand-line px-4 py-3 align-top font-semibold text-navy-deep",
  cell: "border-t border-sand-line px-4 py-3 align-top text-ink",
} as const;
