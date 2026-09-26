"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CONSENT_VERSION, type ConsentDecision } from "@/application/dtos/Consent";
import type { AnalyticsService } from "@/application/ports/AnalyticsService";
import { getContainer } from "@/infrastructure/config";

export interface ConsentContextValue {
  /** The stored decision, or null while undecided (or before `ready`). */
  decision: ConsentDecision | null;
  /** True once the stored decision has been read on the client. */
  ready: boolean;
  accept(): void;
  reject(): void;
  /** Shows the consent banner again so the visitor can change their choice. */
  reopen(): void;
  /** Whether the consent banner should be shown. */
  isBannerOpen: boolean;
}

const AnalyticsContext = createContext<AnalyticsService | null>(null);
const ConsentContext = createContext<ConsentContextValue | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [{ service, repository }] = useState(() => {
    const container = getContainer();
    return { service: container.getAnalyticsService(), repository: container.getConsentRepository() };
  });
  const [decision, setDecision] = useState<ConsentDecision | null>(null);
  const [ready, setReady] = useState(false);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const stored = repository.get();
    setDecision(stored);
    setReady(true);
    if (stored?.analytics) service.setConsent(true);
  }, [repository, service]);

  const decide = useCallback(
    (analytics: boolean) => {
      const next: ConsentDecision = { analytics, decidedAt: new Date().toISOString(), version: CONSENT_VERSION };
      repository.set(next);
      service.setConsent(analytics);
      setDecision(next);
      setReopened(false);
    },
    [repository, service],
  );

  const accept = useCallback(() => decide(true), [decide]);
  const reject = useCallback(() => decide(false), [decide]);
  const reopen = useCallback(() => setReopened(true), []);

  const consent = useMemo<ConsentContextValue>(
    () => ({ decision, ready, accept, reject, reopen, isBannerOpen: ready && (decision === null || reopened) }),
    [decision, ready, accept, reject, reopen, reopened],
  );

  return (
    <AnalyticsContext.Provider value={service}>
      <ConsentContext.Provider value={consent}>{children}</ConsentContext.Provider>
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsService {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an <AnalyticsProvider>.");
  }
  return context;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within an <AnalyticsProvider>.");
  }
  return context;
}
