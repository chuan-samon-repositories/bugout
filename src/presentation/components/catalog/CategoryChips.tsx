"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import type { CategorySummary } from "@/application/catalog";
import type { FilterCriteria } from "@/application/dtos/FilterCriteria";
import { cn, focusRing } from "@/presentation/components/ui";
import { formatNumber, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { serializeCatalogCriteria } from "./catalogSearchParams";
import { categoryLabel } from "./categoryLabel";

export interface CategoryChipsProps {
  criteria: FilterCriteria;
  categories: readonly CategorySummary[];
  totalCount: number;
  onCategoryChange(category: string | undefined): void;
}

const chipClass = cn(
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] px-[1.125rem] text-[0.84375rem] font-bold transition-colors",
  focusRing,
);

/**
 * The partner design's centred category chips. Each is a real link to its filtered URL
 * (works without JavaScript); with JavaScript the click filters in memory instead.
 */
export function CategoryChips({ criteria, categories, totalCount, onCategoryChange }: CategoryChipsProps) {
  const t = messages.catalog.filters;
  const chips = [
    { slug: undefined, label: t.allCategories, count: totalCount },
    ...categories.map((category) => ({ slug: category.slug, label: categoryLabel(category.slug), count: category.count })),
  ];

  const href = (slug: string | undefined) => {
    const query = serializeCatalogCriteria({ ...criteria, category: slug }).toString();
    return query ? `${routes.products}?${query}` : routes.products;
  };

  return (
    <nav aria-label={t.categoriesLabel}>
      <ul className="flex flex-wrap justify-center gap-2.5">
        {chips.map(({ slug, label, count }) => {
          const active = criteria.category === slug;
          const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
            event.preventDefault();
            onCategoryChange(slug);
          };
          return (
            <li key={slug ?? "all"}>
              <Link
                href={href(slug)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                onClick={onClick}
                className={cn(
                  chipClass,
                  active
                    ? "border-navy-deep bg-navy-deep text-sand"
                    : "border-sand-line bg-white text-navy-deep hover:border-accent",
                )}
              >
                {label}
                <span className={cn("text-xs font-semibold", active ? "text-sand/80" : "text-muted")}>
                  {t.categoryCount(formatNumber(count))}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
