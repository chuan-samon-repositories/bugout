"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/presentation/components/ui/cn";
import { isCurrentLink, type NavLink } from "./navigation";

interface NavLinkListProps {
  links: NavLink[];
  className?: string;
  linkClassName: string;
  /** Extra classes for the link of the current page. */
  currentClassName?: string;
  /**
   * Extra classes for every other link. Put state-dependent utilities (like the text colour)
   * here and in `currentClassName`, never in `linkClassName`: cn() does not merge conflicts.
   */
  idleClassName?: string;
  onNavigate?: () => void;
}

function Links({ search, links, className, linkClassName, currentClassName, idleClassName, onNavigate }: NavLinkListProps & { search: Pick<URLSearchParams, "get"> | null }) {
  const pathname = usePathname();
  return (
    <ul className={className}>
      {links.map((link) => {
        const current = isCurrentLink(link.href, pathname, search);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={current ? "page" : undefined}
              onClick={onNavigate}
              className={cn(linkClassName, current ? currentClassName : idleClassName)}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function LinksWithSearch(props: NavLinkListProps) {
  const search = useSearchParams();
  return <Links {...props} search={search} />;
}

/** Navigation links that mark the current page with aria-current="page". */
export function NavLinkList(props: NavLinkListProps) {
  return (
    <Suspense fallback={<Links {...props} search={null} />}>
      <LinksWithSearch {...props} />
    </Suspense>
  );
}
