import { CONSENT_VERSION, ConsentDecision } from '@/application/dtos/Consent';
import { ConsentRepository } from '@/application/ports/ConsentRepository';
import { KeyValueStorage, browserStorage } from '../storage';

export const CONSENT_STORAGE_KEY = 'bugout.consent';

function parseDecision(raw: string | null): ConsentDecision | null {
  if (raw === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const { analytics, decidedAt, version } = data as Record<string, unknown>;
  if (typeof analytics !== 'boolean' || typeof decidedAt !== 'string' || Number.isNaN(Date.parse(decidedAt))) {
    return null;
  }
  // A decision made under another policy version must be asked again.
  if (version !== CONSENT_VERSION) return null;
  return { analytics, decidedAt, version };
}

/** Cookie/analytics consent in localStorage. Returns null (undecided) on the server or for unusable data. */
export class LocalStorageConsentRepository implements ConsentRepository {
  constructor(
    private readonly storage?: KeyValueStorage | null,
    private readonly key: string = CONSENT_STORAGE_KEY,
  ) {}

  get(): ConsentDecision | null {
    try {
      return parseDecision(this.resolve()?.getItem(this.key) ?? null);
    } catch {
      return null;
    }
  }

  set(decision: ConsentDecision): void {
    try {
      this.resolve()?.setItem(this.key, JSON.stringify(decision));
    } catch (error) {
      console.warn('[consent] Could not store the consent decision', error);
    }
  }

  private resolve(): KeyValueStorage | null {
    return this.storage === undefined ? browserStorage() : this.storage;
  }
}
