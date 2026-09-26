import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export type VisuallyHiddenProps = ComponentPropsWithoutRef<"span">;

/** Content read by assistive technology but not shown on screen. */
export function VisuallyHidden({ className, ...props }: VisuallyHiddenProps) {
  return <span className={cn("sr-only", className)} {...props} />;
}
