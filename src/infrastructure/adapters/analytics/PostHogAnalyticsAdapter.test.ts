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
  });
});
