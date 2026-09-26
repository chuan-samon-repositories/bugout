/**
 * Replaces every transport the posthog-js SDK can use (fetch, XMLHttpRequest and
 * sendBeacon) with a recorder of the requested URLs, for tests that run the real SDK
 * in jsdom. Must run before posthog-js is imported, because the SDK keeps its own
 * reference to fetch.
 */
export function fakePostHogNetwork(record: (url: string) => void = () => {}): void {
  const fetch = async (url: string | URL) => {
    record(String(url));
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  class RecordingXMLHttpRequest {
    open(_method: string, url: string) {
      record(url);
    }
    send() {}
    setRequestHeader() {}
    addEventListener() {}
  }
  const sendBeacon = (url: string) => {
    record(url);
    return true;
  };
  for (const target of [globalThis, window] as Array<Record<string, unknown>>) {
    Object.defineProperty(target, 'fetch', { configurable: true, writable: true, value: fetch });
    Object.defineProperty(target, 'XMLHttpRequest', { configurable: true, writable: true, value: RecordingXMLHttpRequest });
  }
  Object.defineProperty(window.navigator, 'sendBeacon', { configurable: true, value: sendBeacon });
}
