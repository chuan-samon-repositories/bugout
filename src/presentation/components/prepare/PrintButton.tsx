"use client";

import { Button } from "@/presentation/components/ui";

/** Opens the browser's print dialog (for the kit checklist). Hidden when printing. */
export function PrintButton({ label }: { label: string }) {
  return (
    <span className="print:hidden">
      <Button variant="secondary" onClick={() => window.print()}>
        {label}
      </Button>
    </span>
  );
}
