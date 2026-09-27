import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { DISTINCT_ID_ATTRIBUTE, SESSION_ID_ATTRIBUTE } from './checkoutAttributes';

const source = readFileSync(join(process.cwd(), 'shopify/custom-pixel.js'), 'utf8');

type Handler = (event: unknown) => void;

/** Runs the pixel in a sandbox like Shopify's: `analytics.subscribe` and `fetch` only. */
function loadPixel() {
  const handlers = new Map<string, Handler>();
  const fetch = vi.fn().mockResolvedValue({ ok: true });
  runInNewContext(source, { analytics: { subscribe: (name: string, handler: Handler) => handlers.set(name, handler) }, fetch });
  const emit = (name: string, data: unknown) => handlers.get(name)?.({ name, timestamp: '2026-09-20T10:00:00Z', data });
  const sent = () => fetch.mock.calls.map(([, init]) => JSON.parse(init.body));
  return { emit, sent, fetch };
}

const checkout = (attributes: Array<{ key: string; value: string }>) => ({
  attributes,
  currencyCode: 'EUR',
  subtotalPrice: { amount: 199, currencyCode: 'EUR' },
  lineItems: [{ quantity: 1 }, { quantity: 2 }],
  email: 'ana@example.es',
});

const linked = checkout([
  { key: DISTINCT_ID_ATTRIBUTE, value: 'visitor-1' },
  { key: SESSION_ID_ATTRIBUTE, value: 'session-1' },
]);

describe('Shopify custom pixel', () => {
  it('reads the same cart attributes the site writes', () => {
    expect(source).toContain(`const DISTINCT_ID_ATTRIBUTE = "${DISTINCT_ID_ATTRIBUTE}"`);
    expect(source).toContain(`const SESSION_ID_ATTRIBUTE = "${SESSION_ID_ATTRIBUTE}"`);
  });

  it('sends each checkout step under the visitor id and session from the cart attributes', () => {
    const pixel = loadPixel();
    pixel.emit('checkout_started', { checkout: linked });
    pixel.emit('checkout_contact_info_submitted', { checkout: linked });
    pixel.emit('payment_info_submitted', { checkout: linked });
    const [contact, payment] = pixel.sent();
    expect(pixel.fetch.mock.calls[0][0]).toBe('https://eu.i.posthog.com/i/v0/e/');
    expect(contact).toMatchObject({
      event: 'checkout_step_completed',
      distinct_id: 'visitor-1',
      timestamp: '2026-09-20T10:00:00Z',
      properties: {
        step: 1,
        step_name: 'contact',
        cart_value: 199,
        cart_item_count: 3,
        currency: 'EUR',
        checkout_type: 'hosted',
        $session_id: 'session-1',
        $process_person_profile: false,
      },
    });
    expect(payment.properties).toMatchObject({ step: 4, step_name: 'payment' });
    expect(JSON.stringify(pixel.sent())).not.toContain('ana@example.es');
  });

  it('sends alerts without their message, for a linked checkout', () => {
    const pixel = loadPixel();
    pixel.emit('checkout_started', { checkout: linked });
    pixel.emit('alert_displayed', { alert: { type: 'INPUT_INVALID', target: 'shippingAddress.zip', value: 'Código 35001 no válido' } });
    const [alert] = pixel.sent();
    expect(alert).toMatchObject({
      event: 'checkout_alert_displayed',
      properties: { alert_type: 'INPUT_INVALID', alert_target: 'shippingAddress.zip' },
    });
    expect(JSON.stringify(alert)).not.toContain('35001');
  });

  it('sends nothing when the site had no analytics consent (no visitor id on the cart)', () => {
    const pixel = loadPixel();
    const unlinked = checkout([]);
    pixel.emit('checkout_started', { checkout: unlinked });
    pixel.emit('checkout_contact_info_submitted', { checkout: unlinked });
    pixel.emit('alert_displayed', { alert: { type: 'ERROR', target: 'x' } });
    expect(pixel.fetch).not.toHaveBeenCalled();
  });
});
