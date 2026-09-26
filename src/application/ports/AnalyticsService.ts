import { AnalyticsEvent } from '../analytics/events';

/**
 * Product analytics. Implementations must drop events until the visitor has
 * granted analytics consent, and must never throw into the calling code.
 */
export interface AnalyticsService {
  track(event: AnalyticsEvent): void;
  captureException(error: unknown, context?: Record<string, string | number | boolean>): void;
  /** Called when the visitor grants or withdraws consent. */
  setConsent(granted: boolean): void;
}
