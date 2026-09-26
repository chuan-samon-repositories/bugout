import { OrderConfirmation, OrderLine } from '@/application/dtos/Order';
import { OrderConfirmationStore } from '@/application/ports/OrderConfirmationStore';
import { OrderTotals, isShippingMethodId } from '@/domain/entities/order/OrderPricing';
import { Money } from '@/domain/value-objects/Money';
import { KeyValueStorage, browserSessionStorage } from '@/infrastructure/adapters/storage';

export const LAST_ORDER_STORAGE_KEY = 'bugout.lastOrder';

type TotalsKey = keyof OrderTotals;
const TOTALS_KEYS: readonly TotalsKey[] = ['subtotal', 'shipping', 'tax', 'total'];

/** Money as JSON: integer minor units plus the ISO currency code. */
interface StoredMoney {
  minor: number;
  currency: string;
}

interface StoredOrder extends Omit<OrderConfirmation, 'totals'> {
  totals: Record<TotalsKey, StoredMoney>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isFilledString = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';
const isMinorUnits = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

function toStored(confirmation: OrderConfirmation): StoredOrder {
  const totals = Object.fromEntries(
    TOTALS_KEYS.map((key) => [key, { minor: confirmation.totals[key].minor, currency: confirmation.totals[key].currency }]),
  ) as Record<TotalsKey, StoredMoney>;
  return {
    orderNumber: confirmation.orderNumber,
    placedAt: confirmation.placedAt,
    email: confirmation.email,
    lines: confirmation.lines.map(toLine),
    shippingMethod: confirmation.shippingMethod,
    totals,
  };
}

function toLine(line: OrderLine): OrderLine {
  const { productId, name, quantity, unitPriceMinor, subtotalMinor } = line;
  return { productId, name, quantity, unitPriceMinor, subtotalMinor };
}

/** A line with a positive integer quantity whose subtotal is exactly unit price × quantity. */
function parseLine(value: unknown): OrderLine | null {
  if (!isRecord(value)) return null;
  const { productId, name, quantity, unitPriceMinor, subtotalMinor } = value;
  if (
    !isFilledString(productId) ||
    !isFilledString(name) ||
    !Number.isSafeInteger(quantity) ||
    (quantity as number) < 1 ||
    !isMinorUnits(unitPriceMinor) ||
    !isMinorUnits(subtotalMinor) ||
    subtotalMinor !== unitPriceMinor * (quantity as number)
  ) {
    return null;
  }
  return { productId, name, quantity: quantity as number, unitPriceMinor, subtotalMinor };
}

/** Money.fromMinor rejects fractions, negatives and malformed currency codes. */
function parseMoney(value: unknown): Money {
  if (!isRecord(value) || typeof value.minor !== 'number' || typeof value.currency !== 'string') {
    throw new Error('Invalid stored money');
  }
  return Money.fromMinor(value.minor, value.currency);
}

function parseTotals(value: unknown, lines: readonly OrderLine[]): OrderTotals | null {
  if (!isRecord(value)) return null;
  const [subtotal, shipping, tax, total] = TOTALS_KEYS.map((key) => parseMoney(value[key]));
  const currency = subtotal.currency;
  if ([shipping, tax, total].some((money) => money.currency !== currency)) return null;
  // The subtotal is the sum of the lines; the total covers subtotal and shipping and contains the tax.
  const linesSubtotal = lines.reduce((sum, line) => sum + line.subtotalMinor, 0);
  if (subtotal.minor !== linesSubtotal) return null;
  if (total.minor < subtotal.minor + shipping.minor || tax.minor > total.minor) return null;
  return { subtotal, shipping, tax, total };
}

/** Rebuilds a confirmation from its JSON form; null when the value is not a valid stored order. */
export function parseStoredOrder(raw: string | null): OrderConfirmation | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return null;
    const { orderNumber, placedAt, email, shippingMethod } = value;
    if (
      !isFilledString(orderNumber) ||
      !isFilledString(placedAt) ||
      Number.isNaN(Date.parse(placedAt)) ||
      !isFilledString(email) ||
      !isShippingMethodId(shippingMethod) ||
      !Array.isArray(value.lines) ||
      value.lines.length === 0
    ) {
      return null;
    }
    const lines = value.lines.map(parseLine);
    if (lines.some((line) => line === null)) return null;
    const validLines = lines as OrderLine[];
    const totals = parseTotals(value.totals, validLines);
    if (!totals) return null;
    return { orderNumber, placedAt, email, lines: validLines, shippingMethod, totals };
  } catch {
    return null;
  }
}

export function serializeOrder(confirmation: OrderConfirmation): string {
  return JSON.stringify(toStored(confirmation));
}

/**
 * The last placed order in sessionStorage (key `bugout.lastOrder`), with Money
 * serialised as minor units plus currency. Loading validates strictly and returns
 * null for anything that is not a well-formed order, and on the server.
 */
export class SessionStorageOrderConfirmationStore implements OrderConfirmationStore {
  constructor(
    private readonly storage?: KeyValueStorage | null,
    private readonly key: string = LAST_ORDER_STORAGE_KEY,
  ) {}

  save(confirmation: OrderConfirmation): void {
    try {
      this.resolve()?.setItem(this.key, serializeOrder(confirmation));
    } catch {
      // Storage may be unavailable (private mode, quota); the confirmation still renders from state.
    }
  }

  load(): OrderConfirmation | null {
    try {
      return parseStoredOrder(this.resolve()?.getItem(this.key) ?? null);
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      this.resolve()?.removeItem(this.key);
    } catch {
      // Nothing to clear when storage is unavailable.
    }
  }

  private resolve(): KeyValueStorage | null {
    return this.storage === undefined ? browserSessionStorage() : this.storage;
  }
}
