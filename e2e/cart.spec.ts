import type { Locator, Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import {
  CART_KEY,
  MAX_PER_PRODUCT,
  PRODUCTS,
  cartButton,
  cartButtonName,
  cartDrawer,
  cartLine,
  consentBanner,
  openCartDrawer,
  openPage,
  readStorage,
  rejectConsent,
  seedCart,
  writeStorage,
} from './support/site';

function quantityInput(page: Page): Locator {
  return page.getByRole('main').getByRole('spinbutton', { name: 'Cantidad' });
}

function addToCartButton(page: Page): Locator {
  return page.getByRole('main').getByRole('button', { name: 'Añadir al carrito' });
}

function lineQuantity(line: Locator): Locator {
  return line.getByText(/^Cantidad: \d+$/);
}

async function closeDrawer(page: Page) {
  await page.keyboard.press('Escape');
  await expect(cartDrawer(page)).toBeHidden();
}

test.describe('cart', () => {
  test('product quantity is bounded by what is already in the cart', async ({ page }) => {
    const product = PRODUCTS.firstAid;
    await openPage(page, `/products/${product.id}`);
    const input = quantityInput(page);
    const increase = page.getByRole('main').getByRole('button', { name: 'Aumentar cantidad', exact: true });
    const decrease = page.getByRole('main').getByRole('button', { name: 'Reducir cantidad', exact: true });

    await expect(input).toHaveValue('1');
    await expect(input).toHaveAttribute('max', String(MAX_PER_PRODUCT));
    await expect(decrease).toBeDisabled();

    await input.fill('150');
    await input.blur();
    await expect(input).toHaveValue(String(MAX_PER_PRODUCT));
    await expect(increase).toBeDisabled();

    await input.fill('90');
    await input.blur();
    await addToCartButton(page).click();
    const line = cartLine(cartDrawer(page), product.name);
    await expect(lineQuantity(line)).toHaveText('Cantidad: 90');
    await closeDrawer(page);

    await expect(input).toHaveValue('1');
    await expect(input).toHaveAttribute('max', '9');
    await expect(page.getByText('Ya tienes 90 unidades en el carrito. Puedes añadir hasta 9 unidades más.')).toBeVisible();
    await expect(input).toHaveAccessibleDescription(/Puedes añadir hasta 9 unidades más\./);

    await input.fill('50');
    await input.blur();
    await expect(input).toHaveValue('9');
    await expect(increase).toBeDisabled();

    await addToCartButton(page).click();
    await expect(lineQuantity(line)).toHaveText(`Cantidad: ${MAX_PER_PRODUCT}`);
    await expect(line.getByRole('button', { name: `Aumentar cantidad de ${product.name}` })).toBeDisabled();
    await expect(line.getByRole('button', { name: `Reducir cantidad de ${product.name}` })).toBeEnabled();
    await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(MAX_PER_PRODUCT));
    await closeDrawer(page);

    await expect(page.getByRole('status').filter({ hasText: 'Ya tienes el máximo de unidades en el carrito' })).toBeVisible();
    await expect(addToCartButton(page)).toBeDisabled();
  });

  test('Escape closes the drawer and returns focus to the cart button', async ({ page }) => {
    await openPage(page, '/');
    await seedCart(page, [{ productId: PRODUCTS.water.id, quantity: 1 }]);

    const trigger = cartButton(page);
    await trigger.focus();
    await page.keyboard.press('Enter');
    const drawer = cartDrawer(page);
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Cerrar' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('removing a line keeps the other lines', async ({ page }) => {
    await openPage(page, '/');
    await seedCart(page, [
      { productId: PRODUCTS.water.id, quantity: 1 },
      { productId: PRODUCTS.firstAid.id, quantity: 2 },
    ]);
    const drawer = await openCartDrawer(page);

    await cartLine(drawer, PRODUCTS.water.name).getByRole('button', { name: `Eliminar ${PRODUCTS.water.name} del carrito` }).click();

    await expect(cartLine(drawer, PRODUCTS.water.name)).toHaveCount(0);
    await expect(cartLine(drawer, PRODUCTS.firstAid.name)).toHaveCount(1);
    await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(2));
    await expect.poll(() => readStorage(page, CART_KEY)).toEqual({
      version: 2,
      items: [{ productId: PRODUCTS.firstAid.id, quantity: 2 }],
    });
  });

  test('"Vaciar carrito" asks for confirmation first', async ({ page }) => {
    await openPage(page, '/');
    await seedCart(page, [
      { productId: PRODUCTS.water.id, quantity: 1 },
      { productId: PRODUCTS.food.id, quantity: 3 },
    ]);
    const drawer = await openCartDrawer(page);
    const lines = drawer.getByRole('list', { name: 'Productos en tu carrito' }).getByRole('listitem');
    await expect(lines).toHaveCount(2);

    await drawer.getByRole('button', { name: 'Vaciar carrito' }).click();
    const confirm = drawer.getByRole('group', { name: 'Vaciar carrito' });
    await expect(confirm.getByText('¿Seguro que quieres vaciar el carrito?')).toBeVisible();
    await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeFocused();

    await confirm.getByRole('button', { name: 'Cancelar' }).click();
    await expect(confirm).toBeHidden();
    await expect(lines).toHaveCount(2);
    await expect(drawer.getByRole('button', { name: 'Vaciar carrito' })).toBeFocused();

    await drawer.getByRole('button', { name: 'Vaciar carrito' }).click();
    await confirm.getByRole('button', { name: 'Sí, vaciar' }).click();

    await expect(drawer.getByText('Tu carrito está vacío.')).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Finalizar compra' })).toHaveCount(0);
    await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(0));
    await expect.poll(() => readStorage(page, CART_KEY)).toBeNull();
  });

  test('localStorage keeps only product ids and quantities', async ({ page }) => {
    await openPage(page, `/products/${PRODUCTS.backpack24h.id}`);
    await addToCartButton(page).click();
    await expect(cartDrawer(page)).toBeVisible();
    await closeDrawer(page);

    await page.goto(`/products/${PRODUCTS.water.id}`);
    // The restored count only appears once the page has hydrated.
    await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(1));
    await quantityInput(page).fill('3');
    await addToCartButton(page).click();
    await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(4));

    expect(await readStorage(page, CART_KEY)).toStrictEqual({
      version: 2,
      items: [
        { productId: PRODUCTS.backpack24h.id, quantity: 1 },
        { productId: PRODUCTS.water.id, quantity: 3 },
      ],
    });
  });

  test('a tampered stored cart is clamped and unknown products are dropped', async ({ page }) => {
    const product = PRODUCTS.firstAid;
    await openPage(page, '/');
    await seedCart(
      page,
      [
        { productId: product.id, quantity: 500 },
        { productId: 'producto-inventado', quantity: 1 },
      ],
      MAX_PER_PRODUCT,
    );

    const drawer = await openCartDrawer(page);
    const lines = drawer.getByRole('list', { name: 'Productos en tu carrito' }).getByRole('listitem');
    await expect(lines).toHaveCount(1);
    const line = cartLine(drawer, product.name);
    await expect(lineQuantity(line)).toHaveText(`Cantidad: ${MAX_PER_PRODUCT}`);
    await expect(line.getByRole('button', { name: `Aumentar cantidad de ${product.name}` })).toBeDisabled();

    // The next write persists the sanitised cart.
    await line.getByRole('button', { name: `Reducir cantidad de ${product.name}` }).click();
    await expect(lineQuantity(line)).toHaveText(`Cantidad: ${MAX_PER_PRODUCT - 1}`);
    await expect.poll(() => readStorage(page, CART_KEY)).toStrictEqual({
      version: 2,
      items: [{ productId: product.id, quantity: MAX_PER_PRODUCT - 1 }],
    });
  });

  test('a corrupted stored cart falls back to an empty cart', async ({ page, problems }) => {
    await openPage(page, '/');
    await page.evaluate((key) => window.localStorage.setItem(key, '{not json'), CART_KEY);
    await page.reload();
    const drawer = await openCartDrawer(page);
    await expect(drawer.getByText('Tu carrito está vacío.')).toBeVisible();
    expect(problems.pageErrors).toEqual([]);
  });

  test('two tabs stay in sync', async ({ page, context }) => {
    const other = await context.newPage();
    await page.goto(`/products/${PRODUCTS.food.id}`);
    await other.goto('/about');
    // The banner renders once each tab has hydrated and subscribed to storage events.
    await expect(consentBanner(other)).toBeVisible();
    await rejectConsent(page);
    // The consent decision is shared across tabs, so the other tab's banner closes too.
    await expect(consentBanner(other)).toBeHidden();
    await expect(cartButton(other)).toHaveAccessibleName(cartButtonName(0));

    await addToCartButton(page).click();
    await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(1));
    await expect(cartButton(other)).toHaveAccessibleName(cartButtonName(1));

    // And back: emptying the cart in the other tab updates the first one.
    const drawer = await openCartDrawer(other);
    await cartLine(drawer, PRODUCTS.food.name).getByRole('button', { name: `Eliminar ${PRODUCTS.food.name} del carrito` }).click();
    await expect(cartButton(other)).toHaveAccessibleName(cartButtonName(0));
    await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(0));
  });

  test('a stored cart written by another tab is picked up', async ({ page }) => {
    await openPage(page, '/');
    const other = await page.context().newPage();
    await other.goto('/');
    await writeStorage(other, CART_KEY, { version: 2, items: [{ productId: PRODUCTS.water.id, quantity: 2 }] });
    await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(2));
  });
});
