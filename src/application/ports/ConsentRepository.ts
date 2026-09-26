import { ConsentDecision } from '../dtos/Consent';

/** Stores the visitor's cookie/analytics consent decision. */
export interface ConsentRepository {
  /** Null when the visitor has not decided yet. */
  get(): ConsentDecision | null;
  set(decision: ConsentDecision): void;
}
