import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaceOrderUseCase } from './PlaceOrderUseCase';
import { InMemoryCartRepository } from '@/application/testing/fakes';
import { buildCheckoutDetails } from '@/application/testing/checkoutDetails';
import { FormValidationError } from '@/application/errors';
import { OrderConfirmation, OrderRequest } from '@/application/dtos/Order';
import { OrderGateway } from '@/application/ports/OrderGateway';
import { buildProduct } from '@/domain/testing/buildProduct';
import { testPricingPolicy } from '@/domain/testing/testPricingPolicy';
import { ShippingMethodId } from '@/domain/entities/order/OrderPricing';
import { ValidationError } from '@/domain/errors';
import { Quantity } from '@/domain/value-objects/Quantity';

function gateway(): OrderGateway & { placeOrder: ReturnType<typeof vi.fn> } {
  return {
    placeOrder: vi.fn(
      async (request: OrderRequest): Promise<OrderConfirmation> => ({
        orderNumber: 'BUG-TEST0001',
        placedAt: '2026-01-01T00:00:00.000Z',
        email: request.details.customer.email,
        lines: request.lines,
        totals: request.totals,
        shippingMethod: request.details.shippingMethod,
      }),
    ),
  };
}

describe('PlaceOrderUseCase', () => {
  let carts: InMemoryCartRepository;
  let orders: ReturnType<typeof gateway>;
  let useCase: PlaceOrderUseCase;

  beforeEach(async () => {
    carts = new InMemoryCartRepository();
    const cart = await carts.load();
    cart.addItem(buildProduct({ id: 'kit', name: 'Mochila 72H', price: 299 }), new Quantity(2));
    cart.addItem(buildProduct({ id: 'food', name: 'Raciones', price: 49 }), new Quantity(1));
    await carts.save(cart);
    orders = gateway();
    useCase = new PlaceOrderUseCase(carts, orders, testPricingPolicy);
  });

  it('places the order with a minor-unit snapshot and totals, then clears the cart', async () => {
    const confirmation = await useCase.execute(buildCheckoutDetails());

    const request: OrderRequest = orders.placeOrder.mock.calls[0][0];
    expect(request.lines).toEqual([
      { productId: 'kit', name: 'Mochila 72H', quantity: 2, unitPriceMinor: 29900, subtotalMinor: 59800 },
      { productId: 'food', name: 'Raciones', quantity: 1, unitPriceMinor: 4900, subtotalMinor: 4900 },
    ]);
    expect(request.totals.subtotal.minor).toBe(64700);
    expect(request.totals.shipping.minor).toBe(0);
    expect(request.totals.total.minor).toBe(64700);
    expect(confirmation.orderNumber).toBe('BUG-TEST0001');
    expect((await carts.load()).isEmpty()).toBe(true);
  });

  it('charges the selected shipping method', async () => {
    await useCase.execute(buildCheckoutDetails({ shippingMethod: 'express' }));
    expect(orders.placeOrder.mock.calls[0][0].totals.shipping.minor).toBe(995);
  });

  it('trims the details before sending them', async () => {
    await useCase.execute(
      buildCheckoutDetails({ customer: { email: '  ana@example.es ' }, shippingAddress: { country: ' es ' } }),
    );
    const { details } = orders.placeOrder.mock.calls[0][0] as OrderRequest;
    expect(details.customer.email).toBe('ana@example.es');
    expect(details.shippingAddress.country).toBe('ES');
  });

  it('throws FormValidationError with every invalid field and keeps the cart', async () => {
    const details = buildCheckoutDetails({
      customer: { email: 'nope', firstName: ' ' },
      shippingAddress: { postalCode: '99999' },
    });
    const error = await useCase.execute(details).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(FormValidationError);
    expect((error as FormValidationError).fieldErrors).toEqual({
      'customer.email': 'invalidEmail',
      'customer.firstName': 'required',
      'shippingAddress.postalCode': 'invalidPostalCode',
    });
    expect(orders.placeOrder).not.toHaveBeenCalled();
    expect((await carts.load()).isEmpty()).toBe(false);
  });

  it('rejects a shipping method the policy does not offer', async () => {
    const details = buildCheckoutDetails({ shippingMethod: 'drone' as ShippingMethodId });
    await expect(useCase.execute(details)).rejects.toMatchObject({ fieldErrors: { shippingMethod: 'required' } });
  });

  it('throws ValidationError for an empty cart', async () => {
    await carts.clear();
    await expect(useCase.execute(buildCheckoutDetails())).rejects.toBeInstanceOf(ValidationError);
    expect(orders.placeOrder).not.toHaveBeenCalled();
  });

  it('keeps the cart when the gateway fails', async () => {
    orders.placeOrder.mockRejectedValueOnce(new Error('down'));
    await expect(useCase.execute(buildCheckoutDetails())).rejects.toThrow('down');
    expect((await carts.load()).itemCount()).toBe(3);
  });
});
