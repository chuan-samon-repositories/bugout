/** Resolves after `ms` milliseconds; immediately when `ms` is 0. Used by adapters that simulate a backend. */
export function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}
