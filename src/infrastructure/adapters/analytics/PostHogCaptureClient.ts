import { ServerAnalyticsEvent } from '@/application/analytics/events';
import { ServerAnalyticsService, ServerEventContext } from '@/application/ports/ServerAnalyticsService';

/** PostHog's EU ingestion host, used on the server when the browser host is the relative `/ingest` proxy. */
export const DEFAULT_SERVER_POSTHOG_HOST = 'https://eu.i.posthog.com';

export interface PostHogCaptureOptions {
  apiKey: string;
  /** Absolute ingestion host; defaults to PostHog's EU host. */
  host?: string;
  /** Sent with every event (e.g. `app_env`), like the browser's super properties. */
  superProperties?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

/** The server-side ingestion host for a configured browser host: absolute hosts are reused, `/ingest` is not. */
export function serverPostHogHost(browserHost: string | undefined): string {
  const host = browserHost?.trim();
  return host && /^https:\/\//i.test(host) ? host.replace(/\/+$/, '') : DEFAULT_SERVER_POSTHOG_HOST;
}

/**
 * Sends server events to PostHog's capture API. Events never create person profiles
 * (`$process_person_profile: false`), like the browser's anonymous events.
 */
export class PostHogCaptureClient implements ServerAnalyticsService {
  constructor(private readonly options: PostHogCaptureOptions) {}

  async capture(event: ServerAnalyticsEvent, context: ServerEventContext): Promise<void> {
    const host = (this.options.host ?? DEFAULT_SERVER_POSTHOG_HOST).replace(/\/+$/, '');
    const doFetch = this.options.fetchImpl ?? fetch;
    const response = await doFetch(`${host}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        api_key: this.options.apiKey,
        event: event.name,
        distinct_id: context.distinctId,
        uuid: context.uuid,
        timestamp: context.timestamp,
        properties: {
          ...this.options.superProperties,
          ...event.properties,
          ...(context.sessionId ? { $session_id: context.sessionId } : {}),
          $process_person_profile: false,
          $lib: 'bugout-server',
        },
      }),
    });
    if (!response.ok) throw new Error(`PostHog capture failed with HTTP ${response.status}`);
  }
}
