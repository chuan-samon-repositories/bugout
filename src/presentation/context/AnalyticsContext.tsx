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
  /**
   * Shows the consent banner again so the visitor can change their choice. `returnFocusTo` (default: the
   * focused element) gets focus back when the reopened banner closes.
   */
  reopen(returnFocusTo?: HTMLElement | null): void;
  /** Closes a reopened banner without changing the decision and returns focus to the control that opened it. */
  dismiss(): void;
  /** Whether the consent banner should be shown. */
  isBannerOpen: boolean;
  /**
   * Increases every time the visitor reopens the banner (0 until then, and again 0 once it closes), so the
   * banner can move focus into itself. An undecided first visit never steals focus.
   */
  reopenRequest: number;
}

const AnalyticsContext = createContext<AnalyticsService | null>(null);
const ConsentContext = createContext<ConsentContextValue | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [{ service, repository, consentStorageKey }] = useState(() => {
    const container = getContainer();
    return {
      service: container.getAnalyticsService(),
      repository: container.getConsentRepository(),
      /**
       * localStorage key of the stored decision. Only used to recognise `storage` events from other tabs (key
       * null means storage was cleared); the value itself is always read through the ConsentRepository.
       */
      consentStorageKey: container.getSyncedStorageKeys().consent,
    };
  });
  const [decision, setDecision] = useState<ConsentDecision | null>(null);
  const [ready, setReady] = useState(false);
  const [reopenRequest, setReopenRequest] = useState(0);
  const reopened = reopenRequest > 0;
  /** The control that reopened the banner; focus goes back to it when the reopened banner closes. */
  const opener = useRef<HTMLElement | null>(null);

  /** Whether the service currently has consent, so decisions from other tabs only toggle it on real changes. */
  const granted = useRef(false);

  /** Re-applies a stored decision (restored on load, or synced from another tab); only real changes count. */
  const applyStoredConsent = useCallback(
    (analytics: boolean) => {
      if (granted.current === analytics) return;
      granted.current = analytics;
      service.setConsent(analytics, "restored");
    },
    [service],
  );

  const closeReopened = useCallback(() => {
    setReopenRequest(0);
    const target = opener.current;
    opener.current = null;
    if (target?.isConnected) target.focus();
  }, []);

  // A layout effect runs before any child's passive effect, so events children track on mount
  // (e.g. product_viewed on a full page load) already see a restored consent instead of being dropped.
  useLayoutEffect(() => {
    const stored = repository.get();
    setDecision(stored);
    setReady(true);
    if (stored?.analytics) applyStoredConsent(true);
  }, [repository, applyStoredConsent]);

  // Accepting or withdrawing consent in another tab applies here too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== consentStorageKey) return;
      const stored = repository.get();
      setDecision(stored);
      setReopenRequest(0);
      opener.current = null;
      applyStoredConsent(stored?.analytics === true);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [repository, applyStoredConsent, consentStorageKey]);

  const decide = useCallback(
    (analytics: boolean) => {
      const next: ConsentDecision = { analytics, decidedAt: new Date().toISOString(), version: CONSENT_VERSION };
      repository.set(next);
      granted.current = analytics;
      service.setConsent(analytics, "visitor");
      setDecision(next);
      closeReopened();
    },
    [repository, service, closeReopened],
  );

  const accept = useCallback(() => decide(true), [decide]);
  const reject = useCallback(() => decide(false), [decide]);
  const reopen = useCallback((returnFocusTo?: HTMLElement | null) => {
    const active = document.activeElement;
    const fallback = active instanceof HTMLElement && active !== document.body ? active : null;
    opener.current = returnFocusTo ?? fallback;
    setReopenRequest((count) => count + 1);
  }, []);

  const consent = useMemo<ConsentContextValue>(
    () => ({
      decision,
      ready,
      accept,
      reject,
      reopen,
      dismiss: closeReopened,
      isBannerOpen: ready && (decision === null || reopened),
      reopenRequest,
    }),
    [decision, ready, accept, reject, reopen, closeReopened, reopened, reopenRequest],
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
