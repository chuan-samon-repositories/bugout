"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { cn } from "@/presentation/components/ui/cn";
import { isCurrentLink, type NavLink } from "./navigation";

/** Whether a link points at the page being shown (see `isCurrentLink`). */
export type IsCurrent = (href: string) => boolean;

interface CurrentLinkScopeProps {
  render: (isCurrent: IsCurrent) => ReactNode;
}

function Current({ search, render }: CurrentLinkScopeProps & { search: Pick<URLSearchParams, "get"> | null }) {
  const pathname = usePathname();
  return render((href) => isCurrentLink(href, pathname, search));
}

function CurrentWithSearch({ render }: CurrentLinkScopeProps) {
  const search = useSearchParams();
  return <Current search={search} render={render} />;
}

/**
 * Renders navigation that marks the current page. Search params suspend during static
 * rendering, so until they are known no catalog link counts as current.
 */
export function CurrentLinkScope({ render }: CurrentLinkScopeProps) {
  return (
    <Suspense fallback={<Current search={null} render={render} />}>
      <CurrentWithSearch render={render} />
    </Suspense>
  );
}

interface NavLinkListProps {
  /** Links; one with `children` is followed by a nested list of them. */
  links: (NavLink & { children?: NavLink[] })[];
  className?: string;
  linkClassName: string;
  /** Extra classes for the link of the current page. */
  currentClassName?: string;
  /**
   * Extra classes for every other link. Put state-dependent utilities (like the text colour)
   * here and in `currentClassName`, never in `linkClassName`: cn() does not merge conflicts.
   */
  idleClassName?: string;
  /** Classes of the nested lists and their links (the links also get the current/idle classes). */
  childListClassName?: string;
  childLinkClassName?: string;
  onNavigate?: () => void;
}

/** Navigation links that mark the current page with aria-current="page". */
export function NavLinkList({
  links,
  className,
  linkClassName,
  currentClassName,
  idleClassName,
  childListClassName,
  childLinkClassName,
  onNavigate,
}: NavLinkListProps) {
  const item = (link: NavLink, baseClassName: string, isCurrent: IsCurrent) => {
    const current = isCurrent(link.href);
    return (
      <Link
        href={link.href}
        aria-current={current ? "page" : undefined}
        onClick={onNavigate}
        className={cn(baseClassName, current ? currentClassName : idleClassName)}
      >
        {link.label}
      </Link>
    );
  };
  return (
    <CurrentLinkScope
      render={(isCurrent) => (
        <ul className={className}>
          {links.map((link) => (
            <li key={`${link.label} ${link.href}`}>
              {item(link, linkClassName, isCurrent)}
              {link.children && link.children.length > 0 && (
                <ul className={childListClassName}>
                  {link.children.map((child) => (
                    <li key={child.href}>{item(child, childLinkClassName ?? linkClassName, isCurrent)}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    />
  );
}
