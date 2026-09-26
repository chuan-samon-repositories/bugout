import { describe, expect, it, vi } from 'vitest';
import { CreateCheckoutUseCase } from './CreateCheckoutUseCase';
import { InMemoryCartRepository } from '../testing/fakes';
import { CheckoutService } from '../ports/CheckoutService';

function service(url: string): CheckoutService {
  return { getCheckoutUrl: vi.fn().mockResolvedValue(url) };
}

describe('CreateCheckoutUseCase', () => {
  it('returns a local checkout for an in-app route', async () => {
    const carts = new InMemoryCartRepository();
    const checkout = service('/checkout');
    const session = await new CreateCheckoutUseCase(carts, checkout, 'local').execute();
    expect(session).toEqual({ url: '/checkout', type: 'local' });
    expect(checkout.getCheckoutUrl).toHaveBeenCalledWith(expect.objectContaining({ currency: 'EUR' }));
  });

  it('returns a hosted checkout for an absolute http(s) URL', async () => {
    const url = 'https://tienda.myshopify.com/cart/c/abc';
    const session = await new CreateCheckoutUseCase(new InMemoryCartRepository(), service(url), 'shopify').execute();
    expect(session).toEqual({ url, type: 'hosted' });
    const insecure = await new CreateCheckoutUseCase(new InMemoryCartRepository(), service('HTTP://x.test/c'), 'local').execute();
    expect(insecure.type).toBe('hosted');
  });

  it('fails when the Shopify provider returns a relative URL', async () => {
    const useCase = new CreateCheckoutUseCase(new InMemoryCartRepository(), service('/checkout'), 'shopify');
    await expect(useCase.execute()).rejects.toThrow(/non-absolute/);
  });
});
