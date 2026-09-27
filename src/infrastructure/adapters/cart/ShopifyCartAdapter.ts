import type { CartNotice } from '@/application/dtos/Cart';
import { CartRepository } from '@/application/ports/CartRepository';
import { Cart, MAX_QUANTITY_PER_ITEM } from '@/domain/entities/cart/Cart';
import { CurrencyCode } from '@/domain/value-objects/Money';
import { ProductId } from '@/domain/value-objects/ProductId';
import { Quantity } from '@/domain/value-objects/Quantity';
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
  CartMutationPayload,
  STOCK_WARNING_CODES,
  ShopifyCartLine,
  ShopifyCartNode,
  toLineInputs,
} from '@/infrastructure/adapters/shopify/cartGraphql';
import { mapShopifyProduct } from '@/infrastructure/adapters/shopify/productMapping';
import { ShopifyCartIdStore } from '@/infrastructure/adapters/shopify/ShopifyCartIdStore';
import { ShopifyApiError, ShopifyClient, assertNoUserErrors } from '@/infrastructure/adapters/shopify/ShopifyClient';

interface RemoteLine {
  lineId: string;
  quantity: number;
}

/** What Shopify holds for the current cart id, used to turn aggregate changes into line mutations. */
interface RemoteSnapshot {
  cartId: string;
  lines: Map<string, RemoteLine>;
  /** Extra lines for a merchandise id already in `lines` (merged into one on the next save). */
  duplicateLineIds: string[];
}

function toSnapshot(cart: ShopifyCartNode): RemoteSnapshot {
  const lines = new Map<string, RemoteLine>();
  const duplicateLineIds: string[] = [];
  for (const line of cart.lines.nodes) {
    if (lines.has(line.merchandise.id)) duplicateLineIds.push(line.id);
    else lines.set(line.merchandise.id, { lineId: line.id, quantity: line.quantity });
  }
  return { cartId: cart.id, lines, duplicateLineIds };
}

/** "Kit 72h · 2 personas" for a line, even when its data can't be mapped to a Product. */
function lineName(line: ShopifyCartLine): string {
  try {
    return mapShopifyProduct(line.merchandise.product, line.merchandise).displayName;
  } catch {
    return line.merchandise.product.title;
  }
}

/**
 * Lines that can't be represented (sold out, invalid data) are left out of the aggregate
 * and returned as `removed` notices; the next save removes them from Shopify. A price in
 * another currency is a store configuration problem, not a bad line, so it fails loudly
 * instead: dropping those lines would delete the visitor's whole cart remotely.
 * @throws ShopifyApiError when a line is priced in a currency other than `currency`
 */
function toCart(remote: ShopifyCartNode, currency: CurrencyCode): { cart: Cart; dropped: CartNotice[] } {
  const foreign = remote.lines.nodes.find((line) => line.merchandise.price.currencyCode !== currency);
  if (foreign) {
    throw new ShopifyApiError(
      `Shopify returned prices in ${foreign.merchandise.price.currencyCode} but the store currency is ${currency}. ` +
        `Check that the Shopify market for Spain (ES) sells in ${currency}.`,
    );
  }
  const cart = new Cart(currency);
  const dropped: CartNotice[] = [];
  for (const line of remote.lines.nodes) {
    try {
      const product = mapShopifyProduct(line.merchandise.product, line.merchandise);
      const room = MAX_QUANTITY_PER_ITEM - cart.quantityOf(product.id);
      if (room > 0) cart.addItem(product, new Quantity(Math.min(line.quantity, room)));
    } catch {
      // Skipped; the next save removes the line from Shopify so both sides agree.
      if (!dropped.some((notice) => notice.productId === line.merchandise.id)) {
        dropped.push({ kind: 'removed', productId: line.merchandise.id, productName: lineName(line) });
      }
    }
  }
  return { cart, dropped };
}

function diff(cart: Cart, remote: RemoteSnapshot) {
  const add: Array<{ merchandiseId: string; quantity: number }> = [];
  const update: Array<{ id: string; quantity: number }> = [];
  const remove = [...remote.duplicateLineIds];

  for (const item of cart.getItems()) {
    const merchandiseId = item.product.id.value;
    const line = remote.lines.get(merchandiseId);
    if (!line) add.push({ merchandiseId, quantity: item.quantity.value });
    else if (line.quantity !== item.quantity.value) {
      update.push({ id: line.lineId, quantity: item.quantity.value });
    }
  }
  for (const [merchandiseId, line] of remote.lines) {
    if (cart.quantityOf(new ProductId(merchandiseId)) === 0) remove.push(line.lineId);
  }
  return { add, update, remove };
}

/**
 * Cart stored in Shopify. The cart id lives in localStorage; save() diffs the aggregate
 * against the last known remote lines, sends only the line mutations needed and resolves
 * to the cart the last mutation returned, which is what Shopify holds (it lowers
 * quantities to the stock and leaves sold-out merchandise out, with warnings). After
 * a save that changed the remote cart it bumps SHOPIFY_CART_REVISION_KEY so other tabs
 * reload, and every loaded or mutated cart's checkout URL is remembered in the id store
 * so checkout needs no extra round trip.
 */
export class ShopifyCartAdapter implements CartRepository {
  private snapshot: RemoteSnapshot | null = null;
  private notices: CartNotice[] = [];
  /** Successful remote mutations so far; save() compares it to know whether to bump the revision. */
  private mutations = 0;

  constructor(
    private readonly client: ShopifyClient,
    private readonly cartIds: ShopifyCartIdStore,
    private readonly currency: CurrencyCode,
  ) {}

  async load(): Promise<Cart> {
    this.notices = [];
    const remote = await this.fetchRemote();
    if (!remote) return new Cart(this.currency);
    const { cart, dropped } = toCart(remote, this.currency);
    this.notices = dropped;
    return cart;
  }

  async save(cart: Cart): Promise<Cart> {
    const before = this.mutations;
    let saved: ShopifyCartNode | null;
    try {
      saved = await this.sync(cart);
    } finally {
      // Also after a partial failure: the mutations that did succeed changed the remote cart.
      if (this.mutations !== before) this.cartIds.markChanged();
    }
    // Nothing sent: Shopify already holds exactly `cart`.
    return saved ? toCart(saved, this.currency).cart : cart;
  }

  loadNotices(): readonly CartNotice[] {
    return this.notices;
  }

  async clear(): Promise<void> {
    this.cartIds.clear();
    this.snapshot = null;
  }

  /** Sends the needed mutations and resolves to the cart the last one returned, or null when none was needed. */
  private async sync(cart: Cart): Promise<ShopifyCartNode | null> {
    const remote = await this.currentSnapshot();
    if (!remote) {
      if (cart.isEmpty()) return null;
      const created = await this.mutate('cartCreate', CART_CREATE_MUTATION, { lines: toLineInputs(cart) });
      this.cartIds.set(created.id);
      return created;
    }

    const { add, update, remove } = diff(cart, remote);
    const cartId = remote.cartId;
    let last: ShopifyCartNode | null = null;
    if (remove.length > 0) last = await this.mutate('cartLinesRemove', CART_LINES_REMOVE_MUTATION, { cartId, lineIds: remove });
    if (update.length > 0) last = await this.mutate('cartLinesUpdate', CART_LINES_UPDATE_MUTATION, { cartId, lines: update });
    if (add.length > 0) last = await this.mutate('cartLinesAdd', CART_LINES_ADD_MUTATION, { cartId, lines: add });
    return last;
  }

  private async fetchRemote(): Promise<ShopifyCartNode | null> {
    const cartId = this.cartIds.get();
    if (!cartId) {
      this.snapshot = null;
      return null;
    }
    const { cart } = await this.client.request<{ cart: ShopifyCartNode | null }>(
      CART_QUERY,
      { id: cartId },
      { noStore: true },
    );
    if (!cart) {
      await this.clear();
      return null;
    }
    this.remember(cart);
    return cart;
  }

  /** The remembered remote lines for the stored cart id, refetched if they belong to another cart. */
  private async currentSnapshot(): Promise<RemoteSnapshot | null> {
    const cartId = this.cartIds.get();
    if (cartId && this.snapshot?.cartId === cartId) return this.snapshot;
    return (await this.fetchRemote()) ? this.snapshot : null;
  }

  private async mutate(
    operation: 'cartCreate' | 'cartLinesAdd' | 'cartLinesUpdate' | 'cartLinesRemove',
    mutation: string,
    variables: Record<string, unknown>,
  ): Promise<ShopifyCartNode> {
    const data = await this.client.request<Record<string, CartMutationPayload>>(mutation, variables);
    const payload = data[operation];
    assertNoUserErrors(operation, payload?.userErrors);
    if (!payload?.cart) throw new ShopifyApiError(`${operation} returned no cart`);
    for (const warning of payload.warnings ?? []) {
      // Stock warnings show in the returned cart, which save() maps; anything else is only logged.
      if (!STOCK_WARNING_CODES.includes(warning.code)) {
        console.warn(`[shopify] ${operation} warning ${warning.code}: ${warning.message}`);
      }
    }
    this.mutations += 1;
    this.remember(payload.cart);
    return payload.cart;
  }

  private remember(cart: ShopifyCartNode): void {
    this.snapshot = toSnapshot(cart);
  }
}
