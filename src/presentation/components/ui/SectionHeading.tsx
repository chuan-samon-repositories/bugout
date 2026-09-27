import type { ReactNode } from "react";
import { cn } from "./cn";
import { Eyebrow } from "./Eyebrow";

export interface SectionHeadingProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Id for the h2, so the section can use aria-labelledby. */
  id?: string;
  /** "dark" on navy backgrounds. */
  tone?: "light" | "dark";
  /** "center" (default) is the partner design's section head; "start" aligns left. */
  align?: "center" | "start";
  className?: string;
}

/** Eyebrow + h2 + intro that opens a page section. */
export function SectionHeading({
  title,
  eyebrow,
  description,
  id,
  tone = "light",
  align = "center",
  className,
}: SectionHeadingProps) {
  const dark = tone === "dark";
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-[40rem] text-center" : "max-w-3xl", "mb-12 sm:mb-16", className)}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2 id={id} className={cn("text-[clamp(1.875rem,4vw,2.875rem)] leading-[1.1]", dark ? "text-sand" : "text-navy-deep")}>
        {title}
      </h2>
      {description && (
        <p className={cn("mt-4 text-[1.0625rem] leading-relaxed", dark ? "text-sand/80" : "text-muted")}>{description}</p>
      )}
    </div>
  );
}
