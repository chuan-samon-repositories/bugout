"use client";

import { useId, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useEscapeKey } from "@/presentation/hooks/useEscapeKey";
import { useFocusTrap } from "@/presentation/hooks/useFocusTrap";
import { useLockBodyScroll } from "@/presentation/hooks/useLockBodyScroll";
import { messages } from "@/presentation/i18n";
import { IconButton } from "./Button";
import { cn } from "./cn";
import { CloseIcon } from "./icons";

export type DrawerSide = "left" | "right";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  /** Dialog title; also its accessible name. */
  title: ReactNode;
  children: ReactNode;
  /** Sticky area below the scrollable body (e.g. totals and a checkout button). */
  footer?: ReactNode;
  /** Element to focus when the drawer opens (defaults to the first focusable element). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** "dark": navy panel with sand text (the mobile menu). */
  tone?: "light" | "dark";
  className?: string;
}

const noopSubscribe = () => () => {};

/** True after hydration on the client, false during server rendering. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Modal side panel rendered in a portal on document.body. Traps focus, closes on
 * Escape or backdrop click, locks page scroll and restores focus on close.
 */
export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  children,
  footer,
  initialFocusRef,
  tone = "light",
  className,
}: DrawerProps) {
  const dark = tone === "dark";
  const isClient = useIsClient();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const active = open && isClient;

  useFocusTrap(panelRef, active, { initialFocusRef });
  useEscapeKey(onClose, active);
  useLockBodyScroll(active);

  if (!active) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex">
      <div
        aria-hidden="true"
        data-drawer-backdrop=""
        onClick={onClose}
        className="absolute inset-0 bg-navy-deep/60 transition-opacity duration-300 starting:opacity-0"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex h-full w-full max-w-md flex-col shadow-2xl outline-none",
          dark ? "bg-navy-darker text-sand" : "bg-white",
          "transition-transform duration-300 ease-brand",
          side === "right" ? "ml-auto starting:translate-x-full" : "mr-auto starting:-translate-x-full",
          className,
        )}
      >
        <div className={cn("flex items-center justify-between gap-4 border-b px-4 py-2 sm:px-6", dark ? "border-white/10" : "border-sand-line")}>
          <h2 id={titleId} className={cn("min-w-0 text-lg", dark ? "text-sand" : "text-navy-deep")}>
            {title}
          </h2>
          <IconButton label={messages.common.close} onClick={onClose} variant={dark ? "inverse" : "ghost"} className="-mr-2">
            <CloseIcon className="size-6" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">{children}</div>
        {footer && (
          <div className={cn("border-t px-4 py-4 sm:px-6", dark ? "border-white/10" : "border-sand-line")}>{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
