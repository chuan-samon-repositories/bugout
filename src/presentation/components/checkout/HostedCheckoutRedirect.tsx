"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Spinner } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";

export interface HostedCheckoutRedirectProps {
  /** useCart().checkout: resolves true once the browser is navigating to the hosted checkout. */
  checkout(): Promise<boolean>;
}

const copy = messages.checkout.hosted;

/** Sends the visitor to the provider's hosted checkout once, with a manual retry. */
export function HostedCheckoutRedirect({ checkout }: HostedCheckoutRedirectProps) {
  const started = useRef(false);
  const [redirecting, setRedirecting] = useState(true);

  const start = useCallback(async () => {
    setRedirecting(true);
    // On success the page is unloading, so keep the spinner instead of flashing the retry prompt.
    const navigating = await checkout().catch(() => false);
    if (!navigating) setRedirecting(false);
  }, [checkout]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start().catch(() => undefined);
  }, [start]);

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      {redirecting ? (
        <>
          <Spinner size="lg" decorative className="text-navy" />
          <p role="status" className="text-lg font-medium text-ink">
            {copy.redirecting}
          </p>
        </>
      ) : (
        <>
          <p className="text-lg font-medium text-ink">{copy.notOpened}</p>
          <Button size="lg" onClick={() => start().catch(() => undefined)}>
            {copy.retry}
          </Button>
        </>
      )}
    </div>
  );
}
