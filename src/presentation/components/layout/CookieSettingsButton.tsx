"use client";

import { useConsent } from "@/presentation/context/AnalyticsContext";
import { messages } from "@/presentation/i18n";

/** Reopens the consent banner so the visitor can change their cookie choice. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { reopen } = useConsent();
  return (
    <button type="button" onClick={reopen} className={className}>
      {messages.shell.footer.cookieSettings}
    </button>
  );
}
