export interface ConsentDecision {
  analytics: boolean;
  /** ISO timestamp of when the visitor decided. */
  decidedAt: string;
  /** Bump when the cookie policy changes to ask again. */
  version: number;
}
