// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PostHog as PostHogInstance } from 'posthog-js';
import { PostHogAnalyticsAdapter } from './PostHogAnalyticsAdapter';
import { AnalyticsEvent } from '@/application/analytics/events';
import { fakePostHogNetwork } from '@/infrastructure/testing/fakePostHogNetwork';

/**
 * Runs the adapter against the real posthog-js SDK. Only the network is faked
 * (fetch, XMLHttpRequest and sendBeacon record their URLs), so these tests pin the
 * SDK's actual consent and persistence behaviour, e.g. that reset() clears consent.
 */

const API_KEY = 'phc_sdk_test';
const API_HOST = 'https://ph.invalid';
const OPT_OUT_KEY = `__ph_opt_in_out_${API_KEY}`;

const event: AnalyticsEvent = { name: 'cart_viewed', properties: { cart_value: 199, cart_item_count: 1, currency: 'EUR' } };

let requests: string[] = [];

let PostHog: new () => PostHogInstance;

beforeAll(async () => {
  fakePostHogNetwork((url) => requests.push(url));
  ({ PostHog } = await import('posthog-js'));
});

/**
 * Flushes the SDK's batched request queue the way a page unload does, then lets
 * pending async work (e.g. request compression) finish.
 */
async function flush(): Promise<void> {
  window.dispatchEvent(new Event('pagehide'));
  window.dispatchEvent(new Event('unload'));
  await new Promise((resolve) => setTimeout(resolve, 50));
}

function clearBrowserState(): void {
  window.localStorage.clear();
  window.sessionStorage.clear();
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

const postHogState = () => ({
  cookies: document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter(Boolean),
  localStorage: Object.keys(window.localStorage),
  sessionStorage: Object.keys(window.sessionStorage),
});

/**
 * A page load: a fresh SDK instance (the module singleton can only be initialised once)
 * and a fresh adapter. `captured` lists every event name the SDK captured on this page.
 */
function pageLoad() {
  const instances: PostHogInstance[] = [];
  const captured: string[] = [];
  const loader = vi.fn(async () => {
    const instance = new PostHog();
    const capture = instance.capture.bind(instance);
    instance.capture = ((name, ...rest) => {
      captured.push(name);
      return capture(name, ...rest);
    }) as PostHogInstance['capture'];
    instances.push(instance);
    return instance;
  });
  const adapter = new PostHogAnalyticsAdapter({ apiKey: API_KEY, apiHost: API_HOST }, loader);
  return { adapter, loader, captured, sdk: () => instances[0] };
}

describe('PostHogAnalyticsAdapter with the real posthog-js SDK', () => {
  beforeEach(() => {
    clearBrowserState();
    requests = [];
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    await flush();
    vi.restoreAllMocks();
    clearBrowserState();
  });

  it('initialises nothing, stores nothing and sends nothing before consent', async () => {
    const { adapter, loader } = pageLoad();
    adapter.track(event);
    adapter.captureException(new Error('boom'));
    await adapter.whenIdle();
    await flush();
    expect(loader).not.toHaveBeenCalled();
    expect(requests).toEqual([]);
    expect(postHogState()).toEqual({ cookies: [], localStorage: [], sessionStorage: [] });
  });

  it('captures and sends events once the visitor accepts', async () => {
    const { adapter, sdk } = pageLoad();
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    expect(sdk().is_capturing()).toBe(true);
    expect(sdk().has_opted_in_capturing()).toBe(true);

    adapter.track(event);
    await flush();
    expect(requests.some((url) => url.startsWith(`${API_HOST}/e/`))).toBe(true);
  });

  it('sends $opt_in once for a visitor accept and never for restored decisions on later page loads', async () => {
    const first = pageLoad();
    first.adapter.setConsent(true, 'visitor');
    await first.adapter.whenIdle();
    expect(first.captured.filter((name) => name === '$opt_in')).toHaveLength(1);
    await flush();

    for (let load = 0; load < 3; load++) {
      const reload = pageLoad();
      reload.adapter.setConsent(true, 'restored');
      await reload.adapter.whenIdle();
      reload.adapter.track(event);
      // Synced again from another tab: still no announcement.
      reload.adapter.setConsent(true, 'restored');
      expect(reload.sdk().is_capturing()).toBe(true);
      expect(reload.captured).not.toContain('$opt_in');
      expect(reload.captured).toContain('cart_viewed');
      await flush();
    }
  });

  it('stays opted out after rejection: nothing is captured or sent and only the opt-out record remains', async () => {
    const { adapter, sdk } = pageLoad();
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    adapter.track(event);
    await flush();
    expect(window.localStorage.getItem(OPT_OUT_KEY)).toBe('1');

    adapter.setConsent(false, 'visitor');
    const posthog = sdk();
    expect(posthog.has_opted_out_capturing()).toBe(true);
    expect(posthog.is_capturing()).toBe(false);
    expect(posthog.get_explicit_consent_status()).toBe('denied');

    requests = [];
    adapter.track(event);
    expect(posthog.capture('direct_sdk_call')).toBeUndefined();
    await flush();
    expect(requests).toEqual([]);

    expect(postHogState()).toEqual({ cookies: [], localStorage: [OPT_OUT_KEY], sessionStorage: [] });
    expect(window.localStorage.getItem(OPT_OUT_KEY)).toBe('0');
  });

  it('removes leftover PostHog cookies and storage but keeps unrelated entries', async () => {
    document.cookie = `ph_${API_KEY}_posthog=stale; Path=/`;
    document.cookie = 'ph_other_posthog=stale; Path=/';
    document.cookie = 'bugout_unrelated=1; Path=/';
    window.localStorage.setItem(`ph_${API_KEY}_posthog`, '{}');
    window.localStorage.setItem('__ph_opt_in_out_phc_other', '1');
    window.localStorage.setItem(OPT_OUT_KEY, '1');
    window.localStorage.setItem('bugout.consent', '{}');
    window.sessionStorage.setItem(`ph_${API_KEY}_window_id`, 'w');

    const { adapter, loader } = pageLoad();
    adapter.setConsent(false, 'visitor');

    expect(loader).not.toHaveBeenCalled();
    // A stale opt-in ("1") is withdrawn consent too, so it goes; an opt-out ("0") would stay.
    expect(postHogState()).toEqual({ cookies: ['bugout_unrelated'], localStorage: ['bugout.consent'], sessionStorage: [] });
  });

  it('does not start capturing again after a reload with the rejection restored or no decision', async () => {
    const first = pageLoad();
    first.adapter.setConsent(true, 'visitor');
    await first.adapter.whenIdle();
    first.adapter.setConsent(false, 'visitor');
    await flush();

    for (const restoreRejection of [true, false]) {
      requests = [];
      const reload = pageLoad();
      if (restoreRejection) reload.adapter.setConsent(false, 'restored');
      reload.adapter.track(event);
      await reload.adapter.whenIdle();
      await flush();
      expect(reload.loader).not.toHaveBeenCalled();
      expect(requests).toEqual([]);
    }

    // Even an SDK initialised elsewhere on the page with the same key starts opted out.
    const other = new PostHog();
    other.init(API_KEY, { api_host: API_HOST, advanced_disable_flags: true, disable_session_recording: true });
    expect(other.has_opted_out_capturing()).toBe(true);
    expect(other.is_capturing()).toBe(false);
  });

  it('captures again when the visitor accepts after withdrawing', async () => {
    const { adapter, sdk } = pageLoad();
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    adapter.setConsent(false, 'visitor');
    adapter.setConsent(true, 'visitor');
    expect(sdk().is_capturing()).toBe(true);

    requests = [];
    adapter.track(event);
    await flush();
    expect(requests.some((url) => url.startsWith(`${API_HOST}/e/`))).toBe(true);
  });
});
