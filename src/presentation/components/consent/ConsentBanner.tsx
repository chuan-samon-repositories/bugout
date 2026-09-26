"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button, focusRing } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { useConsent } from "@/presentation/context/AnalyticsContext";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.shell.consent;

/**
 * Keeps an in-flow spacer as tall as the fixed banner, so the banner never permanently covers the end of the
 * page (e.g. checkout buttons on a phone): scrolling to the bottom always reveals it.
 */
function useElementHeight<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    const measure = () => setHeight(element.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [active]);

  return { ref, height };
}

/**
 * Non-blocking cookie notice. Rejecting is exactly as easy as accepting (AEPD guidance).
 * On an undecided first visit it never takes focus. Reopened from "Configurar cookies" (or the cookie policy),
 * it moves focus to its first button, and Escape closes it without changing the decision.
 */
export function ConsentBanner() {
  const { isBannerOpen, accept, reject, dismiss, reopenRequest } = useConsent();
  const firstButton = useRef<HTMLButtonElement>(null);
  const { ref: bannerRef, height } = useElementHeight<HTMLDivElement>(isBannerOpen);

  useEffect(() => {
    if (isBannerOpen && reopenRequest > 0) firstButton.current?.focus();
  }, [isBannerOpen, reopenRequest]);

  if (!isBannerOpen) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || reopenRequest === 0) return;
    event.preventDefault();
    dismiss();
  };

  return (
    <>
      <div aria-hidden="true" className="shrink-0" style={{ height }} />
      <div
        ref={bannerRef}
        role="region"
        aria-label={copy.region}
        onKeyDown={onKeyDown}
        className="ph-no-capture fixed inset-x-0 bottom-0 z-50 border-t border-sand bg-white shadow-[0_-4px_16px_rgb(0_0_0/0.08)]"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:gap-6 lg:px-8">
          <p className="min-w-0 flex-1 text-sm text-ink">
            {copy.text}{" "}
            <Link
              href={routes.cookies}
              className={cn("rounded-sm font-medium text-accent underline underline-offset-4 hover:text-accent-hover", focusRing)}
            >
              {copy.policyLink}
            </Link>
          </p>
          <div className="grid shrink-0 grid-cols-2 gap-3 md:w-72">
            <Button ref={firstButton} variant="secondary" size="md" onClick={reject}>
              {copy.reject}
            </Button>
            <Button variant="secondary" size="md" onClick={accept}>
              {copy.accept}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
