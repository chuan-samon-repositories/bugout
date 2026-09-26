import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ManageCartUseCase } from './ManageCartUseCase';
import { InMemoryCartRepository, InMemoryProductRepository } from '@/application/testing/fakes';
import { buildProduct } from '@/domain/testing/buildProduct';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';
import { ProductId } from '@/domain/value-objects/ProductId';
import { Quantity } from '@/domain/value-objects/Quantity';

const id = (value: string) => new ProductId(value);
const qty = (value: number) => new Quantity(value);

describe('ManageCartUseCase', () => {
  let products: InMemoryProductRepository;
  let carts: InMemoryCartRepository;
  let useCase: ManageCartUseCase;

  beforeEach(() => {
    products = new InMemoryProductRepository([
      buildProduct({ id: 'kit', price: 199 }),
      buildProduct({ id: 'food', price: 49 }),
      buildProduct({ id: 'sold-out', inStock: false }),
    ]);
    carts = new InMemoryCartRepository();
    useCase = new ManageCartUseCase(carts, products);
  });

  it('getCart returns the stored cart', async () => {
    const cart = await useCase.getCart();
    expect(cart.isEmpty()).toBe(true);
  });

  it('addToCart looks the product up, adds it, saves and resolves to the updated cart', async () => {
    const findById = vi.spyOn(products, 'findById');
    const cart = await useCase.addToCart(id('kit'), qty(2));
    expect(findById).toHaveBeenCalledWith(id('kit'));
    expect(cart.quantityOf(id('kit'))).toBe(2);
    expect(cart.totalAmount().minor).toBe(39800);
    expect((await useCase.getCart()).quantityOf(id('kit'))).toBe(2);
  });

  it('addToCart uses the current catalog price', async () => {
    await useCase.addToCart(id('kit'), qty(1));
    products.products = [buildProduct({ id: 'kit', price: 150 })];
    const cart = await useCase.addToCart(id('kit'), qty(1));
    expect(cart.totalAmount().minor).toBe(30000);
  });

  it('addToCart rejects unknown and out-of-stock products without saving', async () => {
    await expect(useCase.addToCart(id('nope'), qty(1))).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.addToCart(id('sold-out'), qty(1))).rejects.toBeInstanceOf(BusinessRuleError);
    expect(carts.saves).toBe(0);
  });

  it('setQuantity sets the exact quantity', async () => {
    await useCase.addToCart(id('kit'), qty(1));
    const cart = await useCase.setQuantity(id('kit'), qty(7));
    expect(cart.quantityOf(id('kit'))).toBe(7);
  });

  it('setQuantity enforces the per-item limit', async () => {
    await useCase.addToCart(id('kit'), qty(1));
    await expect(useCase.setQuantity(id('kit'), qty(100))).rejects.toMatchObject({ code: 'MAX_QUANTITY_EXCEEDED' });
    expect((await useCase.getCart()).quantityOf(id('kit'))).toBe(1);
  });

  it('deleteFromCart removes the whole line', async () => {
    await useCase.addToCart(id('kit'), qty(3));
    await useCase.addToCart(id('food'), qty(1));
    const cart = await useCase.deleteFromCart(id('kit'));
    expect(cart.quantityOf(id('kit'))).toBe(0);
    expect(cart.itemCount()).toBe(1);
  });

  it('clearCart resolves to an empty cart', async () => {
    await useCase.addToCart(id('kit'), qty(3));
    const cart = await useCase.clearCart();
    expect(cart.isEmpty()).toBe(true);
    expect(cart.currency).toBe('EUR');
    expect((await useCase.getCart()).isEmpty()).toBe(true);
  });
});
