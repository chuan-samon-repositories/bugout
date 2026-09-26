import { OrderConfirmation } from '@/application/dtos/Order';

/**
 * Keeps the last placed order for the visitor's current browser session, so the
 * confirmation screen survives a reload. Implementations never throw: without
 * storage (server, blocked storage) save and clear do nothing and load returns null.
 */
export interface OrderConfirmationStore {
  save(confirmation: OrderConfirmation): void;
  /** The stored confirmation, or null when there is none or it is not a valid order. */
  load(): OrderConfirmation | null;
  clear(): void;
}
