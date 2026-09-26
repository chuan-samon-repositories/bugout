import { describe, expect, it, vi } from 'vitest';
import { LocalOrderGateway, generateOrderNumber } from './LocalOrderGateway';
import { OrderRequest } from '@/application/dtos/Order';
import { buildCheckoutDetails } from '@/application/testing/checkoutDetails';
import { Money } from '@/domain/value-objects/Money';

const eur = (minor: number) => Money.fromMinor(minor, 'EUR');

const request: OrderRequest = {
  details: buildCheckoutDetails({ shippingMethod: 'express' }),
  lines: [{ productId: 'kit', name: 'Mochila', quantity: 1, unitPriceMinor: 19900, subtotalMinor: 19900 }],
  totals: { subtotal: eur(19900), shipping: eur(995), tax: eur(3627), total: eur(20895) },
};

describe('LocalOrderGateway', () => {
  it('returns a confirmation for the request', async () => {
    const confirmation = await new LocalOrderGateway({ delayMs: 0 }).placeOrder(request);
    expect(confirmation.orderNumber).toMatch(/^BUG-[0-9A-Z]{8}$/);
    expect(new Date(confirmation.placedAt).toISOString()).toBe(confirmation.placedAt);
    expect(confirmation.email).toBe('ana@example.es');
    expect(confirmation.lines).toEqual(request.lines);
    expect(confirmation.totals).toBe(request.totals);
    expect(confirmation.shippingMethod).toBe('express');
  });

  it('simulates latency', async () => {
    vi.useFakeTimers();
    try {
      let settled = false;
      const pending = new LocalOrderGateway().placeOrder(request).then(() => (settled = true));
      await vi.advanceTimersByTimeAsync(799);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await pending;
      expect(settled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('generateOrderNumber', () => {
  it('produces random BUG- numbers from crypto.getRandomValues', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues');
    const numbers = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
    expect(numbers.size).toBe(50);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
