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
    const { cart, notices } = await useCase.getCart();
    expect(cart.isEmpty()).toBe(true);
    expect(notices).toEqual([]);
  });

  it('addToCart looks the product up, adds it, saves and resolves to the updated cart', async () => {
    const findById = vi.spyOn(products, 'findById');
    const { cart, notices } = await useCase.addToCart(id('kit'), qty(2));
    expect(notices).toEqual([]);
    expect(findById).toHaveBeenCalledWith(id('kit'));
    expect(cart.quantityOf(id('kit'))).toBe(2);
    expect(cart.totalAmount().minor).toBe(39800);
    expect((await useCase.getCart()).cart.quantityOf(id('kit'))).toBe(2);
  });

  it('addToCart uses the current catalog price', async () => {
    await useCase.addToCart(id('kit'), qty(1));
    products.products = [buildProduct({ id: 'kit', price: 150 })];
    const { cart } = await useCase.addToCart(id('kit'), qty(1));
    expect(cart.totalAmount().minor).toBe(30000);
  });

  it('addToCart rejects unknown and out-of-stock products without saving', async () => {
    await expect(useCase.addToCart(id('nope'), qty(1))).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.addToCart(id('sold-out'), qty(1))).rejects.toBeInstanceOf(BusinessRuleError);
    expect(carts.saves).toBe(0);
  });

  it('setQuantity sets the exact quantity', async () => {
    await useCase.addToCart(id('kit'), qty(1));
    const { cart } = await useCase.setQuantity(id('kit'), qty(7));
    expect(cart.quantityOf(id('kit'))).toBe(7);
  });

  it('setQuantity enforces the per-item limit', async () => {
    await useCase.addToCart(id('kit'), qty(1));
    await expect(useCase.setQuantity(id('kit'), qty(100))).rejects.toMatchObject({ code: 'MAX_QUANTITY_EXCEEDED' });
    expect((await useCase.getCart()).cart.quantityOf(id('kit'))).toBe(1);
  });

  it('deleteFromCart removes the whole line', async () => {
    await useCase.addToCart(id('kit'), qty(3));
    await useCase.addToCart(id('food'), qty(1));
    const { cart } = await useCase.deleteFromCart(id('kit'));
    expect(cart.quantityOf(id('kit'))).toBe(0);
    expect(cart.itemCount()).toBe(1);
  });

  it('clearCart resolves to an empty cart', async () => {
    await useCase.addToCart(id('kit'), qty(3));
    const { cart } = await useCase.clearCart();
    expect(cart.isEmpty()).toBe(true);
    expect(cart.currency).toBe('EUR');
    expect((await useCase.getCart()).cart.isEmpty()).toBe(true);
  });

  describe('backend changes', () => {
    it('resolves to what the backend holds and reports a quantity it lowered to the stock', async () => {
      carts.stock = { kit: 3 };
      await useCase.addToCart(id('kit'), qty(2));
      const { cart, notices } = await useCase.addToCart(id('kit'), qty(2));
      expect(cart.quantityOf(id('kit'))).toBe(3);
      expect(notices).toEqual([
        { kind: 'quantityReduced', productId: 'kit', productName: 'Producto de prueba', requested: 4, quantity: 3 },
      ]);
    });

    it('reports a line the backend dropped on save', async () => {
      await useCase.addToCart(id('food'), qty(1));
      carts.stock = { kit: 0 };
      const { cart, notices } = await useCase.addToCart(id('kit'), qty(1));
      expect(cart.quantityOf(id('kit'))).toBe(0);
      expect(cart.quantityOf(id('food'))).toBe(1);
      expect(notices).toEqual([{ kind: 'removed', productId: 'kit', productName: 'Producto de prueba' }]);
    });

    it('names variant lines with the product and the variant', async () => {
      const kit = buildProduct({ id: 'kit-72h', name: 'Kit 72h', variants: [{ id: 'kit-72h-2p', title: '2 personas', price: 69 }] });
      products.products = [kit];
      carts.stock = { 'kit-72h-2p': 1 };
      const { notices } = await useCase.addToCart(id('kit-72h-2p'), qty(2));
      expect(notices).toEqual([expect.objectContaining({ productName: 'Kit 72h · 2 personas', quantity: 1 })]);
    });

    it('reports lines the load dropped, and saves so they are reported only once', async () => {
      await useCase.addToCart(id('food'), qty(1));
      const dropped = { kind: 'removed', productId: 'kit', productName: 'Kit 72h' } as const;
      carts.nextLoadNotices = [dropped];
      const saves = carts.saves;

      const first = await useCase.getCart();
      expect(first.notices).toEqual([dropped]);
      expect(first.cart.quantityOf(id('food'))).toBe(1);
      expect(carts.saves).toBe(saves + 1);

      expect((await useCase.getCart()).notices).toEqual([]);
      expect(carts.saves).toBe(saves + 1);
    });

    it('passes on load notices together with the change', async () => {
      carts.nextLoadNotices = [{ kind: 'removed', productId: 'old', productName: 'Linterna' }];
      const { cart, notices } = await useCase.addToCart(id('food'), qty(1));
      expect(cart.quantityOf(id('food'))).toBe(1);
      expect(notices).toEqual([{ kind: 'removed', productId: 'old', productName: 'Linterna' }]);
    });

    it('still returns the loaded cart and its notices when saving the removals fails', async () => {
      carts.nextLoadNotices = [{ kind: 'removed', productId: 'old', productName: 'Linterna' }];
      vi.spyOn(carts, 'save').mockRejectedValueOnce(new Error('offline'));
      const { cart, notices } = await useCase.getCart();
      expect(cart.isEmpty()).toBe(true);
      expect(notices).toHaveLength(1);
    });
  });
});
