"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronDownIcon, focusRing } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { messages } from "@/presentation/i18n";
import { CurrentLinkScope, type IsCurrent } from "./NavLinkList";
import type { NavSection } from "./navigation";

const topLinkClassName = cn(
  "relative inline-flex min-h-11 items-center rounded-md px-2 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors hover:text-sand",
  "after:absolute after:bottom-2 after:left-2 after:h-0.5 after:w-0 after:bg-orange after:transition-[width] after:duration-250 after:ease-brand hover:after:w-[calc(100%-1rem)]",
  focusRing,
  "focus-visible:ring-offset-navy-darker",
);

const menuLinkClassName = cn(
  "flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-white/8",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-on-navy",
);

/**
 * One top-level entry. Its dropdown opens while the mouse is over it, or with the chevron
 * button next to the link (keyboard and touch), and closes on Escape, on leaving it and on navigation.
 */
function Section({ section, isCurrent }: { section: NavSection; isCurrent: IsCurrent }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const itemRef = useRef<HTMLLIElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const hasMenu = section.children.length > 0;
  const current = isCurrent(section.href);
  const childCurrent = section.children.some((child) => isCurrent(child.href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = () => setOpen(false);
  const onPointer = (value: boolean) => (event: PointerEvent) => {
    if (hasMenu && event.pointerType === "mouse") setOpen(value);
  };
  const onBlur = (event: FocusEvent) => {
    if (!itemRef.current?.contains(event.relatedTarget as Node | null)) close();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !open) return;
    const focusInPanel = panelRef.current?.contains(document.activeElement) ?? false;
    close();
    if (focusInPanel) buttonRef.current?.focus();
  };

  return (
    <li
      ref={itemRef}
      className="relative flex items-center"
      onPointerEnter={onPointer(true)}
      onPointerLeave={onPointer(false)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      <Link
        href={section.href}
        aria-current={current ? "page" : undefined}
        onClick={close}
        className={cn(topLinkClassName, current || childCurrent ? "text-sand after:w-[calc(100%-1rem)]" : "text-sand/85")}
      >
        {section.label}
      </Link>
      {hasMenu && (
        <>
          <button
            ref={buttonRef}
            type="button"
            aria-label={messages.shell.nav.submenu(section.label)}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "-ml-1.5 inline-flex min-h-11 w-6 items-center justify-center rounded-md transition-colors hover:text-sand",
              open ? "text-sand" : "text-sand/85",
              focusRing,
              "focus-visible:ring-offset-navy-darker",
            )}
          >
            <ChevronDownIcon className={cn("size-3.5 motion-safe:transition-transform", open && "rotate-180")} />
          </button>
          {/* The top padding bridges the gap to the panel, so the mouse can reach it without closing it. */}
          <div ref={panelRef} id={panelId} hidden={!open} className="absolute top-full left-1/2 z-10 -translate-x-1/2 pt-2">
            <ul className="min-w-56 rounded-2xl bg-navy-darker p-2 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.55)] ring-1 ring-white/10">
              {section.children.map((child) => {
                const currentChild = isCurrent(child.href);
                return (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      aria-current={currentChild ? "page" : undefined}
                      onClick={close}
                      className={cn(menuLinkClassName, currentChild ? "bg-white/10 text-orange-on-navy" : "text-sand")}
                    >
                      {child.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </li>
  );
}

/** The desktop header's links, with the Kits and Productos dropdowns. */
export function PrimaryNav({ sections }: { sections: NavSection[] }) {
  return (
    <CurrentLinkScope
      render={(isCurrent) => (
        <ul className="flex items-center gap-4">
          {sections.map((section) => (
            <Section key={section.label} section={section} isCurrent={isCurrent} />
          ))}
        </ul>
      )}
    />
  );
}
