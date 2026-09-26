import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type ContainerElement = "div" | "section" | "main" | "header" | "footer" | "nav" | "article";

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ContainerElement;
}

/** Centered, responsive page-width wrapper. */
export function Container({ as: Component = "div", className, ...props }: ContainerProps) {
  return <Component className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
