"use client";

import Link from "next/link";
import { Button, focusRing } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { useConsent } from "@/presentation/context/AnalyticsContext";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.shell.consent;

/** Non-blocking cookie notice. Rejecting is exactly as easy as accepting (AEPD guidance). */
export function ConsentBanner() {
  const { isBannerOpen, accept, reject } = useConsent();

  if (!isBannerOpen) return null;

  return (
    <div
      role="region"
      aria-label={copy.region}
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
          <Button variant="secondary" size="md" onClick={reject}>
            {copy.reject}
          </Button>
          <Button variant="secondary" size="md" onClick={accept}>
            {copy.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}
