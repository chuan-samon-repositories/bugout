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
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={messages.common.breadcrumbs} className={cn("min-w-0 text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${index}-${item.label}`} className="flex min-w-0 items-center gap-1.5">
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn("truncate", isLast && "font-medium text-ink")}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn("rounded-sm underline-offset-4 hover:text-accent hover:underline", focusRing)}
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
  className?: string;
}

export function PageHeader({ title, description, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("py-8 sm:py-10", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} className="mb-4" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
          {description && <div className="mt-3 max-w-3xl text-lg text-muted">{description}</div>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
