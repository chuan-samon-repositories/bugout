"use client";

import { useEffect, useState } from "react";
import { messages } from "@/presentation/i18n";

export interface CopyrightNoticeProps {
  /** Year of the server render, which may be a build-time prerender from a previous year. */
  renderedYear: number;
  className?: string;
}

/**
 * Copyright line whose year follows the visitor's clock. Hydration starts from the server's year,
 * so the markup always matches, and the effect then moves it to the current year if they differ.
 * (suppressHydrationWarning alone would silence the mismatch but keep the stale server text.)
 */
export function CopyrightNotice({ renderedYear, className }: CopyrightNoticeProps) {
  const [year, setYear] = useState(renderedYear);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <p className={className} suppressHydrationWarning>
      {messages.shell.footer.copyright(year)}
    </p>
  );
}
