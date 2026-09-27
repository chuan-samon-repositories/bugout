import { createHash } from 'node:crypto';
import { OrderLineProperties, ServerAnalyticsEvent } from '@/application/analytics/events';
import { ServerEventContext } from '@/application/ports/ServerAnalyticsService';
import { Money } from '@/domain/value-objects/Money';
import { fromOrderAttributes } from '@/infrastructure/adapters/shopify/checkoutAttributes';

/** The webhook topics turned into analytics events. */
export const ORDER_WEBHOOK_TOPICS = ['orders/paid', 'refunds/create', 'orders/cancelled'] as const;
export type OrderWebhookTopic = (typeof ORDER_WEBHOOK_TOPICS)[number];

export function isOrderWebhookTopic(topic: string | null | undefined): topic is OrderWebhookTopic {
  return (ORDER_WEBHOOK_TOPICS as readonly string[]).includes(topic ?? '');
}

export interface OrderAnalyticsEvent {
  event: ServerAnalyticsEvent;
  context: ServerEventContext;
}

/** Loosely typed webhook JSON: only the fields read below, all optional, all validated on use. */
type Json = Record<string, unknown>;

const asObject = (value: unknown): Json => (value && typeof value === 'object' ? (value as Json) : {});
const asArray = (value: unknown): Json[] => (Array.isArray(value) ? value.map(asObject) : []);
const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : typeof value === 'number' ? String(value) : undefined;
const asCount = (value: unknown): number => (typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : 0);

/** A Shopify decimal string ("89.95") in major units, or 0 when missing or malformed. */
function money(value: unknown, currency: string): Money {
  const amount = asString(value);
  try {
    return amount ? Money.fromMajor(amount, currency) : Money.zero(currency);
  } catch {
    return Money.zero(currency);
  }
}

/**
 * A stable UUID for one webhook event (same topic and resource id → same UUID), so Shopify's retries
 * deduplicate in PostHog instead of counting an order twice.
 */
export function eventUuid(key: string): string {
  const hex = createHash('sha256').update(key).digest('hex').slice(0, 32).split('');
  hex[12] = '5';
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const s = hex.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

/** Matches the storefront's variant titles: Shopify sends a bare "2" for the "Personas" option. */
function variantTitle(value: unknown): string | null {
  const title = asString(value);
  if (!title || title === 'Default Title') return null;
  if (!/^\d+$/.test(title)) return title;
  return Number(title) === 1 ? '1 persona' : `${Number(title)} personas`;
}

/** The variant GID the storefront uses as `product_id` (`gid://shopify/ProductVariant/<id>`). */
function variantGid(value: unknown): string {
  const id = asString(value);
  return id ? `gid://shopify/ProductVariant/${id}` : 'unknown';
}

function orderLines(order: Json, currency: string): OrderLineProperties[] {
  return asArray(order.line_items).map((line) => ({
    product_id: variantGid(line.variant_id),
    product_name: asString(line.title) ?? 'unknown',
    variant_title: variantTitle(line.variant_title),
    quantity: asCount(line.quantity),
    price: money(line.price, currency).amount,
  }));
}

const standInDistinctId = (orderId: string) => `shopify_order_${orderId}`;

function paidOrder(order: Json): OrderAnalyticsEvent | null {
  const orderId = asString(order.id);
  const currency = asString(order.currency);
  if (!orderId || !currency) return null;
  const products = orderLines(order, currency);
  const shippingLines = asArray(order.shipping_lines);
  const shipping = shippingLines.reduce((sum, line) => sum.add(money(line.price, currency)), Money.zero(currency));
  const attribution = fromOrderAttributes(asArray(order.note_attributes));
  const discountCodes = asArray(order.discount_codes)
    .map((discount) => asString(discount.code))
    .filter((code): code is string => code !== undefined);
  return {
    event: {
      name: 'order_completed',
      properties: {
        order_id: orderId,
        revenue: money(order.total_price, currency).amount,
        shipping: shipping.amount,
        tax: money(order.total_tax, currency).amount,
        discount: money(order.total_discounts, currency).amount,
        discount_codes: discountCodes,
        currency,
        item_count: products.reduce((count, line) => count + line.quantity, 0),
        shipping_method: asString(shippingLines[0]?.title) ?? 'unknown',
        products,
        checkout_type: 'hosted',
        test_order: order.test === true,
        ...attribution.campaign,
      },
    },
    context: {
      uuid: eventUuid(`orders/paid:${orderId}`),
      timestamp: asString(order.processed_at) ?? asString(order.created_at) ?? new Date().toISOString(),
      distinctId: attribution.distinctId ?? standInDistinctId(orderId),
      sessionId: attribution.sessionId,
    },
  };
}

function cancelledOrder(order: Json): OrderAnalyticsEvent | null {
  const orderId = asString(order.id);
  const currency = asString(order.currency);
  if (!orderId || !currency) return null;
  const attribution = fromOrderAttributes(asArray(order.note_attributes));
  return {
    event: {
      name: 'order_cancelled',
      properties: {
        order_id: orderId,
        reason: asString(order.cancel_reason) ?? 'other',
        revenue: money(order.total_price, currency).amount,
        currency,
        test_order: order.test === true,
      },
    },
    context: {
      uuid: eventUuid(`orders/cancelled:${orderId}`),
      timestamp: asString(order.cancelled_at) ?? new Date().toISOString(),
      distinctId: attribution.distinctId ?? standInDistinctId(orderId),
      sessionId: attribution.sessionId,
    },
  };
}

/** Refund payloads carry no order attributes, so the refund is filed under the order's stand-in id. */
function refund(payload: Json): OrderAnalyticsEvent | null {
  const refundId = asString(payload.id);
  const orderId = asString(payload.order_id);
  if (!refundId || !orderId) return null;
  const transactions = asArray(payload.transactions).filter(
    (transaction) => transaction.kind === 'refund' && transaction.status === 'success',
  );
  const currency = asString(transactions[0]?.currency) ?? asString(asObject(payload.order).currency);
  if (!currency) return null;
  const amount = transactions.reduce((sum, transaction) => sum.add(money(transaction.amount, currency)), Money.zero(currency));
  return {
    event: {
      name: 'order_refunded',
      properties: {
        order_id: orderId,
        refund_amount: amount.amount,
        currency,
        item_count: asArray(payload.refund_line_items).reduce((count, line) => count + asCount(line.quantity), 0),
        test_order: transactions.some((transaction) => transaction.test === true),
      },
    },
    context: {
      uuid: eventUuid(`refunds/create:${refundId}`),
      timestamp: asString(payload.processed_at) ?? asString(payload.created_at) ?? new Date().toISOString(),
      distinctId: standInDistinctId(orderId),
    },
  };
}

/** The analytics event for a webhook, or null when the payload lacks what the event needs. */
export function orderAnalyticsEvent(topic: OrderWebhookTopic, payload: unknown): OrderAnalyticsEvent | null {
  const body = asObject(payload);
  switch (topic) {
    case 'orders/paid':
      return paidOrder(body);
    case 'orders/cancelled':
      return cancelledOrder(body);
    case 'refunds/create':
      return refund(body);
  }
}
