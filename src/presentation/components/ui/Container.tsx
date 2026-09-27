import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type ContainerElement = "div" | "section" | "main" | "header" | "footer" | "nav" | "article";

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ContainerElement;
}

/** Centered, responsive page-width wrapper (1180px, the partner design's --container). */
export function Container({ as: Component = "div", className, ...props }: ContainerProps) {
  return <Component className={cn("mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
