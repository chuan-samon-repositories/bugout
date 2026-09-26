import { messages } from "@/presentation/i18n";
import { cn } from "./cn";
import { VisuallyHidden } from "./VisuallyHidden";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Text announced to screen readers. Defaults to messages.common.loading. */
  label?: string;
  /** Hide from assistive technology (e.g. inside a button that already sets aria-busy). */
  decorative?: boolean;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-10",
};

/** Loading indicator with a visually hidden status label. */
export function Spinner({ size = "md", label = messages.common.loading, decorative = false, className }: SpinnerProps) {
  const svg = (
    <svg
      className={cn("animate-spin", sizeClasses[size])}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );

  if (decorative) {
    return <span className={cn("inline-flex shrink-0", className)} aria-hidden="true">{svg}</span>;
  }

  return (
    <span role="status" className={cn("inline-flex shrink-0 items-center", className)}>
      {svg}
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}
