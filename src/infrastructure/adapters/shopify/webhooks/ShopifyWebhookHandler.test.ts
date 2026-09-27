import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { ShopifyWebhookHandler, isValidShopifyHmac } from './ShopifyWebhookHandler';
import { eventUuid, orderAnalyticsEvent } from './orderEvents';
import { PostHogCaptureClient, serverPostHogHost } from '@/infrastructure/adapters/analytics/PostHogCaptureClient';

const SECRET = 'whsec_test';
const sign = (body: string, secret = SECRET) => createHmac('sha256', secret).update(body, 'utf8').digest('base64');

const paidOrder = {
  id: 5550001,
  name: '#1001',
  currency: 'EUR',
  processed_at: '2026-09-20T10:15:00+02:00',
  total_price: '204.90',
  total_tax: '35.56',
  total_discounts: '10.00',
  test: false,
  discount_codes: [{ code: 'BIENVENIDA', amount: '10.00', type: 'fixed_amount' }],
  shipping_lines: [{ title: 'Envío estándar', price: '4.95' }],
  line_items: [
    { variant_id: 42, title: 'Kit 72h', variant_title: '2', quantity: 1, price: '199.00' },
    { variant_id: 43, title: 'Linterna', variant_title: 'Default Title', quantity: 2, price: '5.00' },
  ],
  note_attributes: [
    { name: '_ph_distinct_id', value: 'visitor-1' },
    { name: '_ph_session_id', value: 'session-1' },
    { name: '_utm_source', value: 'google' },
    { name: '_utm_medium', value: 'cpc' },
    { name: '_gclid', value: 'Cj0K' },
  ],
  // Personal data that must never reach analytics.
  email: 'ana@example.es',
  customer: { first_name: 'Ana' },
  shipping_address: { address1: 'Calle Mayor 1', zip: '28001' },
};

describe('orderAnalyticsEvent', () => {
  it('maps a paid order to order_completed, linked to the visit that placed it', () => {
    const mapped = orderAnalyticsEvent('orders/paid', paidOrder);
    expect(mapped).toEqual({
      event: {
        name: 'order_completed',
        properties: {
          order_id: '5550001',
          revenue: 204.9,
          shipping: 4.95,
          tax: 35.56,
          discount: 10,
          discount_codes: ['BIENVENIDA'],
          currency: 'EUR',
          item_count: 3,
          shipping_method: 'Envío estándar',
          products: [
            { product_id: 'gid://shopify/ProductVariant/42', product_name: 'Kit 72h', variant_title: '2 personas', quantity: 1, price: 199 },
            { product_id: 'gid://shopify/ProductVariant/43', product_name: 'Linterna', variant_title: null, quantity: 2, price: 5 },
          ],
          checkout_type: 'hosted',
          test_order: false,
          utm_source: 'google',
          utm_medium: 'cpc',
          gclid: 'Cj0K',
        },
      },
      context: {
        uuid: eventUuid('orders/paid:5550001'),
        timestamp: '2026-09-20T10:15:00+02:00',
        distinctId: 'visitor-1',
        sessionId: 'session-1',
      },
    });
    expect(JSON.stringify(mapped)).not.toMatch(/ana@example|Ana|Calle Mayor|28001/);
  });

  it('files an order without attribution (no consent) under a stand-in id, without a session', () => {
    const mapped = orderAnalyticsEvent('orders/paid', { ...paidOrder, note_attributes: [], test: true });
    expect(mapped?.context).toMatchObject({ distinctId: 'shopify_order_5550001', sessionId: undefined });
    expect(mapped?.event.properties).toMatchObject({ test_order: true });
    expect(mapped?.event.properties).not.toHaveProperty('utm_source');
  });

  it('maps a refund with its successful refund transactions', () => {
    const mapped = orderAnalyticsEvent('refunds/create', {
      id: 900,
      order_id: 5550001,
      created_at: '2026-09-22T09:00:00+02:00',
      refund_line_items: [{ quantity: 1 }],
      transactions: [
        { kind: 'refund', status: 'success', amount: '199.00', currency: 'EUR', test: false },
        { kind: 'refund', status: 'failure', amount: '5.00', currency: 'EUR' },
      ],
    });
    expect(mapped).toEqual({
      event: {
        name: 'order_refunded',
        properties: { order_id: '5550001', refund_amount: 199, currency: 'EUR', item_count: 1, test_order: false },
      },
      context: {
        uuid: eventUuid('refunds/create:900'),
        timestamp: '2026-09-22T09:00:00+02:00',
        distinctId: 'shopify_order_5550001',
      },
    });
  });

  it('maps a cancellation with its reason', () => {
    const mapped = orderAnalyticsEvent('orders/cancelled', {
      ...paidOrder,
      cancel_reason: 'inventory',
      cancelled_at: '2026-09-21T08:00:00+02:00',
    });
    expect(mapped?.event).toEqual({
      name: 'order_cancelled',
      properties: { order_id: '5550001', reason: 'inventory', revenue: 204.9, currency: 'EUR', test_order: false },
    });
    expect(mapped?.context.distinctId).toBe('visitor-1');
  });

  it('returns null for payloads without an id or currency', () => {
    expect(orderAnalyticsEvent('orders/paid', {})).toBeNull();
    expect(orderAnalyticsEvent('refunds/create', { id: 1, order_id: 2, transactions: [] })).toBeNull();
  });
});

describe('eventUuid', () => {
  it('is a stable RFC 4122-shaped UUID per key', () => {
    expect(eventUuid('orders/paid:1')).toBe(eventUuid('orders/paid:1'));
    expect(eventUuid('orders/paid:1')).not.toBe(eventUuid('orders/paid:2'));
    expect(eventUuid('orders/paid:1')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('isValidShopifyHmac', () => {
  it('accepts Shopify signatures and rejects anything else', () => {
    const body = '{"id":1}';
    expect(isValidShopifyHmac(body, sign(body), SECRET)).toBe(true);
    expect(isValidShopifyHmac(body, sign(body, 'other'), SECRET)).toBe(false);
    expect(isValidShopifyHmac(`${body} `, sign(body), SECRET)).toBe(false);
    expect(isValidShopifyHmac(body, null, SECRET)).toBe(false);
    expect(isValidShopifyHmac(body, 'not base64!', SECRET)).toBe(false);
  });
});

describe('ShopifyWebhookHandler', () => {
  const body = JSON.stringify(paidOrder);
  const analytics = () => ({ capture: vi.fn().mockResolvedValue(undefined) });

  it('sends the event for a signed order webhook', async () => {
    const service = analytics();
    const result = await new ShopifyWebhookHandler(SECRET, service).handle({ topic: 'orders/paid', hmac: sign(body), rawBody: body });
    expect(result.status).toBe(200);
    expect(service.capture).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'order_completed' }),
      expect.objectContaining({ distinctId: 'visitor-1' }),
    );
  });

  it('rejects unsigned requests and refuses to run without a secret', async () => {
    const service = analytics();
    expect((await new ShopifyWebhookHandler(SECRET, service).handle({ topic: 'orders/paid', hmac: 'x', rawBody: body })).status).toBe(401);
    expect((await new ShopifyWebhookHandler(undefined, service).handle({ topic: 'orders/paid', hmac: sign(body), rawBody: body })).status).toBe(503);
    expect(service.capture).not.toHaveBeenCalled();
  });

  it('acknowledges other topics, and everything when analytics is off', async () => {
    const service = analytics();
    expect((await new ShopifyWebhookHandler(SECRET, service).handle({ topic: 'products/update', hmac: sign(body), rawBody: body })).status).toBe(200);
    expect((await new ShopifyWebhookHandler(SECRET, null).handle({ topic: 'orders/paid', hmac: sign(body), rawBody: body })).status).toBe(200);
    expect(service.capture).not.toHaveBeenCalled();
  });

  it('answers 400 to signed invalid JSON and 502 when delivery fails, so Shopify retries', async () => {
    expect((await new ShopifyWebhookHandler(SECRET, analytics()).handle({ topic: 'orders/paid', hmac: sign('{'), rawBody: '{' })).status).toBe(400);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = { capture: vi.fn().mockRejectedValue(new Error('down')) };
    expect((await new ShopifyWebhookHandler(SECRET, failing).handle({ topic: 'orders/paid', hmac: sign(body), rawBody: body })).status).toBe(502);
  });
});

describe('PostHogCaptureClient', () => {
  it('posts an anonymous event with the session, super properties and idempotency key', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const client = new PostHogCaptureClient({ apiKey: 'phc_1', superProperties: { app_env: 'production' }, fetchImpl });
    await client.capture(
      { name: 'order_refunded', properties: { order_id: '1', refund_amount: 5, currency: 'EUR', item_count: 1, test_order: false } },
      { uuid: 'u-1', timestamp: '2026-09-22T09:00:00Z', distinctId: 'visitor-1', sessionId: 'session-1' },
    );
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://eu.i.posthog.com/i/v0/e/');
    expect(JSON.parse(init.body)).toEqual({
      api_key: 'phc_1',
      event: 'order_refunded',
      distinct_id: 'visitor-1',
      uuid: 'u-1',
      timestamp: '2026-09-22T09:00:00Z',
      properties: {
        app_env: 'production',
        order_id: '1',
        refund_amount: 5,
        currency: 'EUR',
        item_count: 1,
        test_order: false,
        $session_id: 'session-1',
        $process_person_profile: false,
        $lib: 'bugout-server',
      },
    });
  });

  it('throws when PostHog does not accept the event', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('no', { status: 503 }));
    const client = new PostHogCaptureClient({ apiKey: 'phc_1', fetchImpl });
    await expect(
      client.capture(
        { name: 'order_cancelled', properties: { order_id: '1', reason: 'other', revenue: 1, currency: 'EUR', test_order: false } },
        { uuid: 'u', timestamp: 't', distinctId: 'd' },
      ),
    ).rejects.toThrow('HTTP 503');
  });

  it('uses an absolute browser host on the server, and the EU host for the /ingest proxy', () => {
    expect(serverPostHogHost('/ingest')).toBe('https://eu.i.posthog.com');
    expect(serverPostHogHost(undefined)).toBe('https://eu.i.posthog.com');
    expect(serverPostHogHost('https://ph.example.com/')).toBe('https://ph.example.com');
  });
});
