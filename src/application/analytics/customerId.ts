/**
 * Pseudonymous, stable analytics id for a customer: SHA-256 of the normalised email.
 * Links a customer's sessions without sending the address itself to analytics.
 * Resolves null where Web Crypto is unavailable (non-secure contexts); skip identify then.
 */
export async function pseudonymousCustomerId(email: string): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;
  const normalised = email.trim().toLowerCase();
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(normalised));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `cust_${hex.slice(0, 32)}`;
}
