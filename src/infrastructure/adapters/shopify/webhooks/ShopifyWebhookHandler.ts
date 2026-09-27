import { createHmac, timingSafeEqual } from 'node:crypto';
import { ServerAnalyticsService } from '@/application/ports/ServerAnalyticsService';
import { isOrderWebhookTopic, orderAnalyticsEvent } from './orderEvents';

export interface ShopifyWebhookRequest {
  /** `X-Shopify-Topic`, e.g. `orders/paid`. */
  topic: string | null;
  /** `X-Shopify-Hmac-Sha256`: base64 HMAC-SHA256 of the raw body with the webhook signing secret. */
  hmac: string | null;
  /** The body exactly as received; the signature covers these bytes. */
  rawBody: string;
}

export interface ShopifyWebhookResult {
  status: number;
  body: string;
}

/** Whether `hmac` is Shopify's signature of `rawBody` with `secret` (constant-time comparison). */
export function isValidShopifyHmac(rawBody: string, hmac: string | null, secret: string): boolean {
  if (!hmac) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  let received: Buffer;
  try {
    received = Buffer.from(hmac, 'base64');
  } catch {
    return false;
  }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Turns Shopify's order webhooks (paid, refunded, cancelled) into server-side analytics events. Answers 401 to
 * unsigned requests, 200 to topics it does not handle and 5xx when it could not deliver the event, so Shopify
 * retries (retries reuse the event's UUID and do not double-count).
 */
export class ShopifyWebhookHandler {
  constructor(
    private readonly secret: string | undefined,
    /** Null when analytics is not configured: signed webhooks are acknowledged and ignored. */
    private readonly analytics: ServerAnalyticsService | null,
  ) {}

  async handle(request: ShopifyWebhookRequest): Promise<ShopifyWebhookResult> {
    if (!this.secret) return { status: 503, body: 'Webhook secret not configured' };
    if (!isValidShopifyHmac(request.rawBody, request.hmac, this.secret)) return { status: 401, body: 'Invalid signature' };
    if (!isOrderWebhookTopic(request.topic) || !this.analytics) return { status: 200, body: 'Ignored' };

    let payload: unknown;
    try {
      payload = JSON.parse(request.rawBody);
    } catch {
      return { status: 400, body: 'Invalid JSON' };
    }
    const mapped = orderAnalyticsEvent(request.topic, payload);
    if (!mapped) return { status: 200, body: 'Ignored: incomplete payload' };
    try {
      await this.analytics.capture(mapped.event, mapped.context);
    } catch (error) {
      console.error('[webhooks] analytics delivery failed', error);
      return { status: 502, body: 'Analytics delivery failed' };
    }
    return { status: 200, body: 'OK' };
  }
}
