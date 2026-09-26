"use client";

import { useConsent } from "@/presentation/context/AnalyticsContext";
import { cn } from "@/presentation/components/ui/cn";
import { messages } from "@/presentation/i18n";

/** Reopens the consent banner so the visitor can change their cookie choice. Never autocaptured by analytics. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { reopen } = useConsent();
  return (
    <button type="button" onClick={reopen} className={cn("ph-no-capture", className)}>
      {messages.shell.footer.cookieSettings}
    </button>
  );
}
