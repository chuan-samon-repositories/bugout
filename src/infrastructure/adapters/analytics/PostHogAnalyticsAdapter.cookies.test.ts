// @vitest-environment jsdom
// @vitest-environment-options {"url": "https://www.bugout.es/tienda/"}
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PostHog as PostHogInstance } from 'posthog-js';
import { PostHogAnalyticsAdapter } from './PostHogAnalyticsAdapter';
import { fakePostHogNetwork } from '@/infrastructure/testing/fakePostHogNetwork';

/**
 * Cookie clean-up on a subdomain host. The SDK writes its cookie on the parent domain
 * (cross-subdomain cookies), so withdrawing consent must expire PostHog cookies on
 * every parent domain of location.hostname, not only on the host itself.
 */

const API_KEY = 'phc_cookie_test';
const DOMAINS = ['www.bugout.es', 'bugout.es'];

const cookieNames = () =>
  document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter(Boolean);

function clearCookies(): void {
  for (const name of cookieNames()) {
    for (const path of ['/', '/tienda/', '/tienda']) {
      document.cookie = `${name}=; Max-Age=0; Path=${path}`;
      for (const domain of DOMAINS) document.cookie = `${name}=; Max-Age=0; Path=${path}; Domain=${domain}`;
    }
  }
}

let PostHog: new () => PostHogInstance;

beforeAll(async () => {
  fakePostHogNetwork();
  ({ PostHog } = await import('posthog-js'));
});

describe('PostHogAnalyticsAdapter cookie clean-up on a subdomain', () => {
  beforeEach(() => {
    clearCookies();
    window.localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearCookies();
    window.localStorage.clear();
  });

  it('expires PostHog cookies on the host and its parent domains without loading the SDK', () => {
    document.cookie = `ph_${API_KEY}_posthog=parent; Domain=bugout.es; Path=/`;
    document.cookie = `ph_${API_KEY}_host=host; Path=/`;
    document.cookie = `ph_${API_KEY}_www=www; Domain=www.bugout.es; Path=/`;
    document.cookie = `ph_${API_KEY}_page=page; Path=/tienda/`;
    document.cookie = 'bugout_unrelated=1; Domain=bugout.es; Path=/';
    expect(cookieNames()).toHaveLength(5);

    const loader = vi.fn(async () => new PostHog());
    const adapter = new PostHogAnalyticsAdapter({ apiKey: API_KEY }, loader);
    adapter.setConsent(false, 'restored');

    expect(loader).not.toHaveBeenCalled();
    expect(cookieNames()).toEqual(['bugout_unrelated']);
  });

  it('expires the cookie the SDK wrote on the parent domain after it was loaded', async () => {
    const adapter = new PostHogAnalyticsAdapter({ apiKey: API_KEY, apiHost: 'https://ph.invalid' }, async () => new PostHog());
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    adapter.track({ name: 'cart_viewed', properties: { cart_value: 1, cart_item_count: 1, currency: 'EUR' } });
    // Stand-in for a cookie left on the parent domain by an earlier visit or SDK version.
    document.cookie = `ph_${API_KEY}_stale=1; Domain=bugout.es; Path=/`;
    expect(cookieNames().some((name) => name.startsWith('ph_'))).toBe(true);

    adapter.setConsent(false, 'visitor');

    expect(cookieNames().filter((name) => name.startsWith('ph_') || name.startsWith('__ph_'))).toEqual([]);
    expect(window.localStorage.getItem(`__ph_opt_in_out_${API_KEY}`)).toBe('0');
  });
});
