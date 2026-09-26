import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ValidationError } from '@/domain/errors';
import { Quantity } from '@/domain/value-objects/Quantity';
import { buildProduct } from '@/domain/testing/buildProduct';
import { CreateCheckoutUseCase } from './CreateCheckoutUseCase';
import { InMemoryCartRepository } from '@/application/testing/fakes';
import { CheckoutService } from '@/application/ports/CheckoutService';
import { CommerceProvider } from '@/application/dtos/Checkout';

function service(url: string): CheckoutService {
  return { getCheckoutUrl: vi.fn().mockResolvedValue(url) };
}

describe('CreateCheckoutUseCase', () => {
  let carts: InMemoryCartRepository;

  beforeEach(async () => {
    carts = new InMemoryCartRepository();
    const cart = await carts.load();
    cart.addItem(buildProduct(), new Quantity(1));
    await carts.save(cart);
  });

  const run = (url: string, provider: CommerceProvider) => new CreateCheckoutUseCase(carts, service(url), provider).execute();

  it('returns a local checkout for an in-app route', async () => {
    const checkout = service('/checkout');
    const session = await new CreateCheckoutUseCase(carts, checkout, 'local').execute();
    expect(session).toEqual({ url: '/checkout', type: 'local' });
    expect(checkout.getCheckoutUrl).toHaveBeenCalledWith(expect.objectContaining({ currency: 'EUR' }));
  });

  it('returns a hosted checkout for an absolute https URL', async () => {
    const url = 'https://tienda.myshopify.com/cart/c/abc?key=1';
    await expect(run(url, 'shopify')).resolves.toEqual({ url, type: 'hosted' });
    await expect(run('HTTPS://tienda.myshopify.com/c', 'local')).resolves.toMatchObject({ type: 'hosted' });
  });

  it('refuses to start checkout for an empty cart', async () => {
    const checkout = service('/checkout');
    const useCase = new CreateCheckoutUseCase(new InMemoryCartRepository(), checkout, 'local');
    await expect(useCase.execute()).rejects.toThrow(ValidationError);
    await expect(useCase.execute()).rejects.toThrow('Cart is empty');
    expect(checkout.getCheckoutUrl).not.toHaveBeenCalled();
  });

  it.each([
    '/checkout',
    'http://tienda.myshopify.com/cart/c/abc',
    'javascript:alert(1)',
    '//evil.example/checkout',
    'https:/tienda.myshopify.com',
    'tienda.myshopify.com/cart',
  ])('fails when the Shopify provider returns %s', async (url) => {
    await expect(run(url, 'shopify')).rejects.toThrow(/absolute https/);
  });

  it.each([
    'http://x.test/c',
    'javascript:alert(1)',
    'data:text/html,hi',
    '//evil.example/checkout',
    '/\\evil.example',
    'checkout',
    '',
  ])('rejects the unsafe local URL %j', async (url) => {
    await expect(run(url, 'local')).rejects.toThrow(/unsafe URL/);
  });
});
