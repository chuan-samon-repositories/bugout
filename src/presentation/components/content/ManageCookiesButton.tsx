"use client";

import { Button, type ButtonProps } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { useConsent } from "@/presentation/context/AnalyticsContext";
import { messages } from "@/presentation/i18n";

export type ManageCookiesButtonProps = Pick<ButtonProps, "variant" | "size" | "className">;

/** Reopens the consent banner so the visitor can change their analytics choice. Never autocaptured by analytics. */
export function ManageCookiesButton({ variant = "secondary", size, className }: ManageCookiesButtonProps) {
  const { reopen } = useConsent();
  return (
    <Button variant={variant} size={size} className={cn("ph-no-capture", className)} onClick={(event) => reopen(event.currentTarget)}>
      {messages.content.manageCookies}
    </Button>
  );
}
