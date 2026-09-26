import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalNewsletterAdapter } from './newsletter/LocalNewsletterAdapter';
import { LocalContactAdapter } from './contact/LocalContactAdapter';

describe('simulated local services', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('resolve after the default 600 ms delay', async () => {
    vi.useFakeTimers();
    let done = 0;
    const pending = [
      new LocalNewsletterAdapter().subscribe().then(() => done++),
      new LocalContactAdapter().send().then(() => done++),
    ];
    await vi.advanceTimersByTimeAsync(599);
    expect(done).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    await Promise.all(pending);
    expect(done).toBe(2);
  });

  it('resolve immediately with a zero delay and make no network calls', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await new LocalNewsletterAdapter({ delayMs: 0 }).subscribe();
    await new LocalContactAdapter({ delayMs: 0 }).send();
    expect(fetch).not.toHaveBeenCalled();
  });
});
