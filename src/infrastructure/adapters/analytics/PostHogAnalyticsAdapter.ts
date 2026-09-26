import type { PostHog } from 'posthog-js';
import { AnalyticsEvent } from '@/application/analytics/events';
import { AnalyticsService } from '@/application/ports/AnalyticsService';

export interface PostHogAnalyticsOptions {
  apiKey: string;
  /** Ingestion host; the app proxies PostHog through `/ingest` (see next.config.ts). */
  apiHost?: string;
  uiHost?: string;
}

type Traits = Record<string, string | number | boolean>;
type Action = (posthog: PostHog) => void;

const MAX_QUEUED_ACTIONS = 100;

const importPostHog = async (): Promise<PostHog> => (await import('posthog-js')).default;

function warn(message: string, error: unknown): void {
  console.warn(`[analytics] ${message}`, error);
}

/**
 * PostHog behind the visitor's consent. Nothing is loaded, sent or stored until
 * setConsent(true); the SDK is then imported on demand so it stays out of the
 * initial bundle. Calls made while it loads are queued and replayed after init.
 */
export class PostHogAnalyticsAdapter implements AnalyticsService {
  private consented = false;
  private posthog: PostHog | null = null;
  private loading: Promise<void> | null = null;
  private queue: Action[] = [];

  constructor(
    private readonly options: PostHogAnalyticsOptions,
    private readonly loadPostHog: () => Promise<PostHog> = importPostHog,
  ) {}

  track(event: AnalyticsEvent): void {
    this.run((posthog) => posthog.capture(event.name, event.properties));
  }

  identify(distinctId: string, traits?: Traits): void {
    this.run((posthog) => posthog.identify(distinctId, traits));
  }

  captureException(error: unknown, context?: Traits): void {
    this.run((posthog) => posthog.captureException(error, context));
  }

  setConsent(granted: boolean): void {
    if (typeof window === 'undefined') return;
    this.consented = granted;
    if (granted) {
      if (this.posthog) this.safely(this.posthog, (posthog) => posthog.opt_in_capturing());
      else this.load();
      return;
    }
    this.queue = [];
    if (this.posthog) {
      this.safely(this.posthog, (posthog) => {
        posthog.opt_out_capturing();
        posthog.reset();
      });
    }
  }

  /** Resolves when any in-flight SDK load has finished. */
  whenIdle(): Promise<void> {
    return this.loading ?? Promise.resolve();
  }

  private run(action: Action): void {
    if (typeof window === 'undefined' || !this.consented) return;
    if (this.posthog) {
      this.safely(this.posthog, action);
      return;
    }
    if (this.queue.length < MAX_QUEUED_ACTIONS) this.queue.push(action);
    this.load();
  }

  private load(): void {
    if (this.loading) return;
    this.loading = this.loadPostHog()
      .then((posthog) => {
        // Consent may have been withdrawn while the SDK was downloading.
        if (!this.consented) return;
        posthog.init(this.options.apiKey, {
          api_host: this.options.apiHost ?? '/ingest',
          ui_host: this.options.uiHost ?? 'https://eu.posthog.com',
          capture_pageview: 'history_change',
          capture_pageleave: true,
          capture_exceptions: true,
          person_profiles: 'identified_only',
          persistence: 'localStorage+cookie',
        });
        posthog.opt_in_capturing();
        this.posthog = posthog;
        const queued = this.queue;
        this.queue = [];
        queued.forEach((action) => this.safely(posthog, action));
      })
      .catch((error: unknown) => {
        this.queue = [];
        warn('PostHog could not be loaded', error);
      })
      .finally(() => {
        this.loading = null;
      });
  }

  private safely(posthog: PostHog, action: Action): void {
    try {
      action(posthog);
    } catch (error) {
      warn('PostHog call failed', error);
    }
  }
}
