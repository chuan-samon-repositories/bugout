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

/** Prefix of the SDK's cookies and storage keys (`ph_<token>_posthog`, `ph_<token>_window_id`, …). */
const SDK_KEY_PREFIX = 'ph_';
/** Prefix of the SDK's consent record, `__ph_opt_in_out_<token>` ("1" opted in, "0" opted out). */
const CONSENT_KEY_PREFIX = '__ph_opt_in_out_';
const OPTED_OUT = '0';

const importPostHog = async (): Promise<PostHog> => (await import('posthog-js')).default;

function warn(message: string, error: unknown): void {
  console.warn(`[analytics] ${message}`, error);
}

function expirePostHogCookies(isPostHogKey: (name: string) => boolean): void {
  if (typeof document === 'undefined') return;
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => name !== '' && isPostHogKey(name));
  const { hostname = '', pathname = '/' } = window.location ?? {};
  for (const name of names) {
    for (const path of new Set(['/', pathname])) {
      document.cookie = `${name}=; Max-Age=0; Path=${path}`;
      if (hostname) document.cookie = `${name}=; Max-Age=0; Path=${path}; Domain=${hostname}`;
    }
  }
}

/**
 * PostHog behind the visitor's consent. Nothing is loaded, sent or stored until
 * setConsent(true); the SDK is then imported on demand so it stays out of the
 * initial bundle. Calls made while it loads are queued and replayed after init.
 * setConsent(false) resets and opts the SDK out, then removes PostHog's cookies and
 * storage except its opt-out record, so nothing is captured on this or later pages.
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
        // reset() clears the stored consent too, so it must run before opting out;
        // the other way round the SDK forgets the opt-out and keeps capturing.
        posthog.reset();
        posthog.opt_out_capturing();
      });
    }
    this.removeLeftoverStorage();
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
          // Once opted out, the SDK also stops persisting its cookie and localStorage state.
          opt_out_persistence_by_default: true,
          disable_session_recording: true,
          // No feature flags, surveys or remote config are used; this also stops the
          // SDK from calling /flags after reset() when consent is withdrawn.
          advanced_disable_flags: true,
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

  /**
   * Deletes every PostHog cookie (for the current host and path) and storage entry
   * except the SDK's own opt-out record, which keeps a later init opted out. Also
   * covers state left by earlier visits when the SDK was never loaded on this page.
   */
  private removeLeftoverStorage(): void {
    const keep = `${CONSENT_KEY_PREFIX}${this.options.apiKey}`;
    const isPostHogKey = (key: string) => key.startsWith(SDK_KEY_PREFIX) || key.startsWith(CONSENT_KEY_PREFIX);
    try {
      const { localStorage, sessionStorage } = window;
      for (const storage of [localStorage, sessionStorage]) {
        if (!storage) continue;
        const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
          (key): key is string => key !== null && isPostHogKey(key),
        );
        for (const key of keys) {
          if (storage === localStorage && key === keep && storage.getItem(key) === OPTED_OUT) continue;
          storage.removeItem(key);
        }
      }
      expirePostHogCookies(isPostHogKey);
    } catch (error) {
      warn('PostHog storage could not be cleared', error);
    }
  }

  private safely(posthog: PostHog, action: Action): void {
    try {
      action(posthog);
    } catch (error) {
      warn('PostHog call failed', error);
    }
  }
}
