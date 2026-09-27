import { ServerAnalyticsEvent } from '@/application/analytics/events';

export interface ServerEventContext {
  /** Idempotency key: the same value for retries of the same event, so the analytics tool can deduplicate. */
  uuid: string;
  /** When it happened (ISO 8601). */
  timestamp: string;
  /** The visitor's anonymous analytics id when the order carries it (consent was given); otherwise a stand-in. */
  distinctId: string;
  /** The visitor's analytics session, so the event joins the session (and campaign) that led to it. */
  sessionId?: string;
}

/** Analytics from the server (webhooks). Sends nothing personal; resolves once the event was accepted. */
export interface ServerAnalyticsService {
  /** @throws Error when the event could not be delivered (so the webhook is retried). */
  capture(event: ServerAnalyticsEvent, context: ServerEventContext): Promise<void>;
}
