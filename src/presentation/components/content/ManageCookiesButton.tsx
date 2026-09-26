"use client";

import { Button, type ButtonProps } from "@/presentation/components/ui";
import { useConsent } from "@/presentation/context/AnalyticsContext";
import { messages } from "@/presentation/i18n";

export type ManageCookiesButtonProps = Pick<ButtonProps, "variant" | "size" | "className">;

/** Reopens the consent banner so the visitor can change their analytics choice. */
export function ManageCookiesButton({ variant = "secondary", size, className }: ManageCookiesButtonProps) {
  const { reopen } = useConsent();
  return (
    <Button variant={variant} size={size} className={className} onClick={reopen}>
      {messages.content.manageCookies}
    </Button>
  );
}
