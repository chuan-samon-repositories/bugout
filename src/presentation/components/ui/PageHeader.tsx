import Link from "next/link";
import type { ReactNode } from "react";
import { messages } from "@/presentation/i18n";
import { focusRing } from "./Button";
import { cn } from "./cn";
import { ChevronRightIcon } from "./icons";

export interface BreadcrumbItem {
  label: string;
  /** Omit for the current page. The last item is always rendered as the current page. */
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** "dark" for navy backgrounds (the hero page header). */
  tone?: "light" | "dark";
  className?: string;
}

export function Breadcrumbs({ items, tone = "light", className }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  const dark = tone === "dark";
  return (
    <nav aria-label={messages.common.breadcrumbs} className={cn("min-w-0 text-sm", className)}>
      <ol className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1", dark ? "text-sand/80" : "text-muted")}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${index}-${item.label}`} className="flex min-w-0 items-center gap-1.5">
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn("truncate", isLast && (dark ? "font-semibold text-sand" : "font-semibold text-ink"))}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-sm underline-offset-4 hover:underline",
                    dark ? "hover:text-orange-on-navy" : "hover:text-accent",
                    focusRing,
                  )}
                >
                  {item.label}
                </Link>
              )}
              {!isLast && <ChevronRightIcon className="size-4 shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface PageHeaderProps {
  /** The page's single <h1>. */
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** Optional trailing content (e.g. a button) aligned with the title on wide screens. */
  actions?: ReactNode;
  /**
   * "hero" (default): full-width navy banner with a centred cream title, the partner
   * design's page hero. Render it outside any Container. "plain": compact, left-aligned
   * title on the page background (checkout).
   */
  tone?: "hero" | "plain";
  className?: string;
}

export function PageHeader({ title, description, breadcrumbs, actions, tone = "hero", className }: PageHeaderProps) {
  if (tone === "hero") {
    return (
      <header
        className={cn(
          "bg-linear-135 from-navy to-navy-darker px-4 pt-10 pb-14 text-center sm:px-8 sm:pt-14 sm:pb-16",
          className,
        )}
      >
        <div className="mx-auto max-w-site">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} tone="dark" className="mb-6 flex justify-center" />
          )}
          <h1 className="text-[clamp(1.875rem,4.5vw,3rem)] leading-tight text-sand">{title}</h1>
          {description && (
            <div className="mx-auto mt-3.5 max-w-[38.75rem] text-[1.0625rem] leading-relaxed text-sand/85">{description}</div>
          )}
          {actions && <div className="mt-6 flex justify-center">{actions}</div>}
        </div>
      </header>
    );
  }

  return (
    <header className={cn("py-8 sm:py-10", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} className="mb-4" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl text-navy-deep sm:text-4xl">{title}</h1>
          {description && <div className="mt-3 max-w-3xl text-lg text-muted">{description}</div>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
