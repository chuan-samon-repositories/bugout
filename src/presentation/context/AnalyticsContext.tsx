"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

/**
 * localStorage key of the stored consent decision (LocalStorageConsentRepository). Only used to recognise
 * `storage` events from other tabs; the value itself is always read through the ConsentRepository.
 */
const CONSENT_STORAGE_KEY = "bugout.consent";

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

  /** Whether the service currently has consent, so decisions from other tabs only toggle it on real changes. */
  const granted = useRef(false);

  const applyConsent = useCallback(
    (analytics: boolean) => {
      if (granted.current === analytics) return;
      granted.current = analytics;
      service.setConsent(analytics);
    },
    [service],
  );

  // A layout effect runs before any child's passive effect, so events children track on mount
  // (e.g. product_viewed on a full page load) already see a restored consent instead of being dropped.
  useLayoutEffect(() => {
    const stored = repository.get();
    setDecision(stored);
    setReady(true);
    if (stored?.analytics) applyConsent(true);
  }, [repository, applyConsent]);

  // Accepting or withdrawing consent in another tab applies here too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== CONSENT_STORAGE_KEY) return;
      const stored = repository.get();
      setDecision(stored);
      setReopened(false);
      applyConsent(stored?.analytics === true);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [repository, applyConsent]);

  const decide = useCallback(
    (analytics: boolean) => {
      const next: ConsentDecision = { analytics, decidedAt: new Date().toISOString(), version: CONSENT_VERSION };
      repository.set(next);
      granted.current = analytics;
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
