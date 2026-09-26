export interface ConsentDecision {
  analytics: boolean;
  /** ISO timestamp of when the visitor decided. */
  decidedAt: string;
  /** Bump when the cookie policy changes to ask again. */
  version: number;
}

/** Current cookie policy version; stored decisions with another version are treated as undecided. */
export const CONSENT_VERSION = 1;
