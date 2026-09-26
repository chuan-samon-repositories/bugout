import { AnalyticsService } from '@/application/ports/AnalyticsService';

/** Used when no analytics key is configured: every call is ignored. */
export class NoopAnalyticsAdapter implements AnalyticsService {
  track(): void {}
  identify(): void {}
  captureException(): void {}
  setConsent(): void {}
}
