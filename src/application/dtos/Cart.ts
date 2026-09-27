import type { Cart } from '@/domain/entities/cart/Cart';

/**
 * A change the cart backend made on its own, which the shopper must be told about.
 * `productId` is the line's variant id and `productName` its display name
 * ("Kit 72h · 2 personas").
 */
export type CartNotice =
  /** The backend kept fewer units than were asked for (not enough stock). */
  | { kind: 'quantityReduced'; productId: string; productName: string; requested: number; quantity: number }
  /** The backend dropped the line: it sold out or can no longer be sold. */
  | { kind: 'removed'; productId: string; productName: string };

/** A cart operation's result: the cart the backend holds, plus what it changed on its own. */
export interface CartUpdate {
  cart: Cart;
  notices: readonly CartNotice[];
}
