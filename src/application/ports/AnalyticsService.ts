import { AnalyticsEvent } from '@/application/analytics/events';

/**
 * Where a consent decision passed to setConsent comes from:
 * - `'visitor'`: the visitor just clicked Accept or Reject;
 * - `'restored'`: a stored decision re-applied on page load or synced from another tab.
 */
export type ConsentOrigin = 'visitor' | 'restored';

/**
 * Product analytics. Implementations must drop events until the visitor has
 * granted analytics consent, and must never throw into the calling code.
 */
export interface AnalyticsService {
  track(event: AnalyticsEvent): void;
  captureException(error: unknown, context?: Record<string, string | number | boolean>): void;
  /**
   * Applies the visitor's analytics consent. `origin` tells a fresh decision from a
   * restored one, so a restored grant is not reported as a new opt-in.
   */
  setConsent(granted: boolean, origin: ConsentOrigin): void;
}
