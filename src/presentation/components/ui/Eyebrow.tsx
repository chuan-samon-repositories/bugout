import type { ReactNode } from "react";
import { cn } from "./cn";

export interface EyebrowProps {
  children: ReactNode;
  /** "dark" on navy backgrounds. */
  tone?: "light" | "dark";
  className?: string;
}

/** Small uppercase kicker above a heading ("Los kits", "Qué hay dentro"). */
export function Eyebrow({ children, tone = "light", className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "mb-4 text-[0.8125rem] font-bold tracking-[0.14em] uppercase",
        tone === "dark" ? "text-orange-on-navy" : "text-accent",
        className,
      )}
    >
      {children}
    </p>
  );
}
