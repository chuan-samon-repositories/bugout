import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostHogAnalyticsAdapter, cookieDomainsFor } from './PostHogAnalyticsAdapter';
import { NoopAnalyticsAdapter } from '@/infrastructure/adapters/analytics/NoopAnalyticsAdapter';
import { AnalyticsEvent } from '@/application/analytics/events';
import { AnalyticsService } from '@/application/ports/AnalyticsService';

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  captureException: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  reset: vi.fn(),
  register: vi.fn(),
  get_distinct_id: vi.fn(),
  get_session_id: vi.fn(),
}));

vi.mock('posthog-js', () => ({ default: posthog }));

const event: AnalyticsEvent = { name: 'cart_viewed', properties: { cart_value: 199, cart_item_count: 1, currency: 'EUR' } };

describe('PostHogAnalyticsAdapter', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {});
    Object.values(posthog).forEach((fn) => fn.mockReset());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const create = () => new PostHogAnalyticsAdapter({ apiKey: 'phc_test' });

  it('drops everything before consent and never loads PostHog', async () => {
    const adapter = create();
    adapter.track(event);
    adapter.captureException(new Error('boom'));
    await adapter.whenIdle();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(posthog.captureException).not.toHaveBeenCalled();
  });

  it('initialises PostHog on consent with the privacy-friendly config', async () => {
    const adapter = create();
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    expect(posthog.init).toHaveBeenCalledWith('phc_test', {
      api_host: '/ingest',
      ui_host: 'https://eu.posthog.com',
      capture_pageview: 'history_change',
      capture_pageleave: true,
      capture_exceptions: true,
      person_profiles: 'identified_only',
      persistence: 'localStorage+cookie',
      opt_out_persistence_by_default: true,
      disable_session_recording: true,
      advanced_disable_flags: true,
      disable_surveys: true,
      autocapture: { dom_event_allowlist: ['click'], css_selector_allowlist: ['a', 'button', 'summary', '[role="button"]'] },
      enable_heatmaps: false,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      capture_performance: false,
    });
    // A visitor's accept is announced with the SDK's default `$opt_in` event.
    expect(posthog.opt_in_capturing).toHaveBeenCalledOnce();
    expect(posthog.opt_in_capturing).toHaveBeenCalledWith();
  });

  it('opts in silently when a stored decision is restored', async () => {
    const adapter = create();
    adapter.setConsent(true, 'restored');
    await adapter.whenIdle();
    expect(posthog.init).toHaveBeenCalledOnce();
    expect(posthog.opt_in_capturing).toHaveBeenCalledOnce();
    expect(posthog.opt_in_capturing).toHaveBeenCalledWith({ captureEventName: false });

    // Synced again from another tab while loaded: still silent.
    adapter.setConsent(true, 'restored');
    expect(posthog.opt_in_capturing).toHaveBeenLastCalledWith({ captureEventName: false });
  });

  it('announces a visitor accept made while a restored load is in flight', async () => {
    const adapter = create();
    adapter.setConsent(true, 'restored');
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    expect(posthog.opt_in_capturing).toHaveBeenCalledOnce();
    expect(posthog.opt_in_capturing).toHaveBeenCalledWith();
  });

  it('does not announce an accept that was withdrawn before the SDK loaded', async () => {
    const adapter = create();
    adapter.setConsent(true, 'visitor');
    adapter.setConsent(false, 'visitor');
    adapter.setConsent(true, 'restored');
    await adapter.whenIdle();
    expect(posthog.opt_in_capturing).toHaveBeenCalledOnce();
    expect(posthog.opt_in_capturing).toHaveBeenCalledWith({ captureEventName: false });
  });

  it('honours a custom ingestion host and keeps the EU UI host', async () => {
    const adapter = new PostHogAnalyticsAdapter({ apiKey: 'k', apiHost: 'https://eu.i.posthog.com' });
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    expect(posthog.init).toHaveBeenCalledWith(
      'k',
      expect.objectContaining({ api_host: 'https://eu.i.posthog.com', ui_host: 'https://eu.posthog.com' }),
    );
  });

  it('queues calls made while loading and flushes them after init, in order', async () => {
    const adapter = create();
    adapter.setConsent(true, 'visitor');
    adapter.track(event);
    const error = new Error('boom');
    adapter.captureException(error, { area: 'cart' });
    expect(posthog.capture).not.toHaveBeenCalled();

    await adapter.whenIdle();
    expect(posthog.capture).toHaveBeenCalledWith('cart_viewed', event.properties);
    expect(posthog.captureException).toHaveBeenCalledWith(error, { area: 'cart' });
    expect(posthog.init.mock.invocationCallOrder[0]).toBeLessThan(posthog.capture.mock.invocationCallOrder[0]);
  });

  it('sends directly once loaded', async () => {
    const adapter = create();
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    adapter.track(event);
    expect(posthog.capture).toHaveBeenCalledOnce();
  });

  it('resets and then opts out when consent is withdrawn, then drops events', async () => {
    const adapter = create();
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    adapter.setConsent(false, 'visitor');
    expect(posthog.opt_out_capturing).toHaveBeenCalledOnce();
    expect(posthog.reset).toHaveBeenCalledOnce();
    // reset() also clears the stored consent, so opting out first would be undone.
    expect(posthog.reset.mock.invocationCallOrder[0]).toBeLessThan(posthog.opt_out_capturing.mock.invocationCallOrder[0]);

    adapter.track(event);
    expect(posthog.capture).not.toHaveBeenCalled();

    adapter.setConsent(true, 'visitor');
    expect(posthog.opt_in_capturing).toHaveBeenCalledTimes(2);
    expect(posthog.opt_in_capturing).toHaveBeenLastCalledWith();
    expect(posthog.init).toHaveBeenCalledOnce();
  });

  it('does not initialise if consent is withdrawn while the SDK loads', async () => {
    const adapter = create();
    adapter.setConsent(true, 'visitor');
    adapter.track(event);
    adapter.setConsent(false, 'visitor');
    await adapter.whenIdle();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('holds events tracked before the decision and sends them, with their time, once the visitor accepts', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-01T10:00:00Z') });
    const adapter = create();
    adapter.track(event);
    vi.setSystemTime(new Date('2026-09-01T10:00:30Z'));
    await Promise.resolve();
    expect(posthog.init).not.toHaveBeenCalled();

    adapter.setConsent(true, 'visitor');
    vi.useRealTimers();
    await adapter.whenIdle();
    expect(posthog.capture).toHaveBeenCalledWith('cart_viewed', event.properties, {
      timestamp: new Date('2026-09-01T10:00:00Z'),
    });
  });

  it('discards held events when the visitor rejects, and holds nothing after a decision', async () => {
    const adapter = create();
    adapter.track(event);
    adapter.setConsent(false, 'visitor');
    adapter.track(event);
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('holds at most 50 events before the decision', async () => {
    const adapter = create();
    for (let i = 0; i < 60; i++) adapter.track(event);
    adapter.setConsent(true, 'restored');
    await adapter.whenIdle();
    expect(posthog.capture).toHaveBeenCalledTimes(50);
  });

  it('registers the super properties after init', async () => {
    const adapter = new PostHogAnalyticsAdapter({ apiKey: 'k', superProperties: { app_env: 'production' } });
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    expect(posthog.register).toHaveBeenCalledWith({ app_env: 'production' });
    expect(posthog.init.mock.invocationCallOrder[0]).toBeLessThan(posthog.register.mock.invocationCallOrder[0]);
  });

  it('sends checkout_started with a beacon, since the page navigates to the hosted checkout right after', async () => {
    const adapter = create();
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    const started: AnalyticsEvent = {
      name: 'checkout_started',
      properties: { cart_value: 18, cart_item_count: 1, currency: 'EUR', checkout_type: 'hosted' },
    };
    adapter.track(started);
    expect(posthog.capture).toHaveBeenCalledWith('checkout_started', started.properties, {
      send_instantly: true,
      transport: 'sendBeacon',
    });
  });

  it('gives the checkout the visitor and session ids and the landing campaign only with consent', async () => {
    vi.stubGlobal('window', { location: { search: '?utm_source=google&utm_campaign=kits&gclid=Cj0K&ref=x' } });
    posthog.get_distinct_id.mockReturnValue('visitor-1');
    posthog.get_session_id.mockReturnValue('session-1');
    const adapter = create();
    expect(adapter.checkoutAttribution()).toEqual({ campaign: {} });

    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    expect(adapter.checkoutAttribution()).toEqual({
      distinctId: 'visitor-1',
      sessionId: 'session-1',
      campaign: { utm_source: 'google', utm_campaign: 'kits', gclid: 'Cj0K' },
    });

    adapter.setConsent(false, 'visitor');
    expect(adapter.checkoutAttribution()).toEqual({ campaign: {} });
  });

  it('does nothing on the server', async () => {
    vi.unstubAllGlobals();
    const loader = vi.fn();
    const adapter = new PostHogAnalyticsAdapter({ apiKey: 'k' }, loader);
    adapter.setConsent(true, 'visitor');
    adapter.track(event);
    await adapter.whenIdle();
    expect(loader).not.toHaveBeenCalled();
  });

  it('never throws: load failures and SDK errors are logged', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failing = new PostHogAnalyticsAdapter({ apiKey: 'k' }, () => Promise.reject(new Error('blocked')));
    failing.setConsent(true, 'visitor');
    failing.track(event);
    await failing.whenIdle();
    expect(warn).toHaveBeenCalledWith('[analytics] PostHog could not be loaded', expect.any(Error));

    posthog.capture.mockImplementation(() => {
      throw new Error('sdk bug');
    });
    const adapter = create();
    adapter.setConsent(true, 'visitor');
    await adapter.whenIdle();
    expect(() => adapter.track(event)).not.toThrow();
    expect(warn).toHaveBeenCalledWith('[analytics] PostHog call failed', expect.any(Error));
  });
});

describe('cookieDomainsFor', () => {
  it('lists the host and every parent domain with at least two labels', () => {
    expect(cookieDomainsFor('www.bugout.es')).toEqual(['www.bugout.es', 'bugout.es']);
    expect(cookieDomainsFor('a.b.bugout.es')).toEqual(['a.b.bugout.es', 'b.bugout.es', 'bugout.es']);
    expect(cookieDomainsFor('bugout.es')).toEqual(['bugout.es']);
  });

  it('uses only the host for single-label hosts and IP addresses', () => {
    expect(cookieDomainsFor('localhost')).toEqual(['localhost']);
    expect(cookieDomainsFor('127.0.0.1')).toEqual(['127.0.0.1']);
    expect(cookieDomainsFor('[::1]')).toEqual(['[::1]']);
    expect(cookieDomainsFor('')).toEqual([]);
  });
});

describe('NoopAnalyticsAdapter', () => {
  it('accepts every call', () => {
    const adapter: AnalyticsService = new NoopAnalyticsAdapter();
    expect(() => {
      adapter.setConsent(true, 'visitor');
      adapter.track(event);
      adapter.captureException(new Error('x'));
    }).not.toThrow();
    expect(adapter.checkoutAttribution()).toEqual({ campaign: {} });
  });
});
