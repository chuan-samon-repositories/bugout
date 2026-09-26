import { expect, test } from './support/fixtures';
import {
  ADDRESS,
  CUSTOMER,
  continueToReview,
  continueToShipping,
  errorSummary,
  fillAddress,
  fillContact,
  openOrderSummary,
  shippingOption,
  stepForm,
  totalsValue,
} from './support/checkout';
import {
  FREE_SHIPPING_FROM,
  PRODUCTS,
  SHIPPING,
  cartButton,
  cartButtonName,
  cartDrawer,
  cartLine,
  eur,
  eurPattern,
  normalizeSpace,
  openPage,
  seedCart,
} from './support/site';

test('golden path: product page to order confirmation', async ({ page }) => {
  const product = PRODUCTS.backpack24h;
  await openPage(page, `/products/${product.id}`);
  await expect(page.getByRole('heading', { level: 1, name: product.name })).toBeVisible();

  await page.getByRole('main').getByRole('button', { name: 'Añadir al carrito' }).click();

  const drawer = cartDrawer(page);
  await expect(drawer).toBeVisible();
  const line = cartLine(drawer, product.name);
  await expect(line).toHaveCount(1);
  await expect(line).toContainText(`Precio por unidad: ${eur(product.price)}`, { useInnerText: true });
  await expect(line).toContainText(`Total de la línea: ${eur(product.price)}`, { useInnerText: true });
  await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(1));

  await drawer.getByRole('button', { name: 'Finalizar compra' }).click();
  await expect(page).toHaveURL('/checkout');
  await expect(drawer).toBeHidden();

  await fillContact(page);
  await continueToShipping(page);
  await fillAddress(page);
  await shippingOption(page, 'Urgente').check();
  const review = await continueToReview(page);
  await expect(review).toContainText(CUSTOMER.email);
  await expect(review).toContainText(`${ADDRESS.postalCode} ${ADDRESS.city}`);

  const summary = await openOrderSummary(page);
  const totalCell = totalsValue(summary, 'Total');
  await expect(totalCell).toBeVisible();
  const total = normalizeSpace(await totalCell.innerText());
  // Prices include IVA; express is never free, so total = product + express shipping.
  expect(total).toBe(normalizeSpace(eur(product.price + SHIPPING.express)));
  await expect(totalsValue(summary, 'Envío (Urgente)')).toHaveText(eurPattern(SHIPPING.express));

  await review.getByRole('button', { name: 'Confirmar pedido' }).click();

  const heading = page.getByRole('heading', { level: 1, name: /^¡Gracias/ });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  const main = page.getByRole('main');
  await expect(totalsValue(main, 'Total')).toHaveText(total);
  await expect(totalsValue(main, 'Correo de contacto')).toHaveText(CUSTOMER.email);
  await expect(totalsValue(main, 'Número de pedido')).toHaveText(/^BUG-[A-Z0-9]{8}$/);
  const orderNumber = await totalsValue(main, 'Número de pedido').innerText();

  await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(0));

  await page.reload();
  await expect(heading).toBeVisible();
  await expect(totalsValue(main, 'Número de pedido')).toHaveText(orderNumber);
  await expect(totalsValue(main, 'Total')).toHaveText(total);
  await expect(totalsValue(main, 'Correo de contacto')).toHaveText(CUSTOMER.email);
  await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(0));
});

test.describe('checkout', () => {
  test.beforeEach(async ({ page }) => {
    await openPage(page, '/');
  });

  test('reloading /checkout with items stays on the checkout', async ({ page }) => {
    await seedCart(page, [{ productId: PRODUCTS.food.id, quantity: 2 }]);
    await page.goto('/checkout');
    await expect(stepForm(page, 'Contacto')).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL('/checkout');
    await expect(stepForm(page, 'Contacto')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Finalizar compra' })).toBeVisible();
  });

  test('empty checkout offers the catalog', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Ver productos' })).toHaveAttribute('href', '/products');
  });

  test('submitting empty contact fields shows the error summary and focuses the email', async ({ page }) => {
    await seedCart(page, [{ productId: PRODUCTS.food.id, quantity: 1 }]);
    await page.goto('/checkout');
    const form = stepForm(page, 'Contacto');
    await form.getByRole('button', { name: 'Continuar con el envío' }).click();

    await expect(errorSummary(form)).toHaveText('Revisa los siguientes 3 campos:');
    for (const label of ['Correo electrónico', 'Nombre', 'Apellidos']) {
      await expect(form.getByRole('link', { name: `${label}: Este campo es obligatorio.` })).toBeVisible();
    }
    const email = form.getByRole('textbox', { name: 'Correo electrónico' });
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription('Este campo es obligatorio.');
    await expect(stepForm(page, 'Envío')).toHaveCount(0);
  });

  test('a Canarias postal code is rejected', async ({ page }) => {
    await seedCart(page, [{ productId: PRODUCTS.food.id, quantity: 1 }]);
    await page.goto('/checkout');
    await fillContact(page);
    const form = await continueToShipping(page);
    // Canarias provinces are not offered, so only the postal code can place the address there.
    await fillAddress(page, { ...ADDRESS, postalCode: '35001' });
    await form.getByRole('button', { name: 'Revisar el pedido' }).click();

    const message = 'Por ahora solo enviamos a la España peninsular y a las islas Baleares.';
    await expect(errorSummary(form)).toHaveText('Revisa el siguiente campo:');
    await expect(form.getByRole('link', { name: `Código postal: ${message}` })).toBeVisible();
    const postalCode = form.getByRole('textbox', { name: 'Código postal' });
    await expect(postalCode).toBeFocused();
    await expect(postalCode).toHaveAttribute('aria-invalid', 'true');
    await expect(postalCode).toHaveAccessibleDescription(message);
    await expect(stepForm(page, 'Revisión')).toHaveCount(0);
  });

  test('standard shipping is free above the threshold', async ({ page }) => {
    const product = PRODUCTS.backpack24h;
    expect(product.price).toBeGreaterThanOrEqual(FREE_SHIPPING_FROM);
    await seedCart(page, [{ productId: product.id, quantity: 1 }]);
    await page.goto('/checkout');
    await fillContact(page);
    await continueToShipping(page);

    await expect(shippingOption(page, 'Estándar')).toBeChecked();
    await expect(shippingOption(page, 'Estándar')).toHaveAccessibleName(/ Gratis$/);
    await expect(shippingOption(page, 'Urgente')).toHaveAccessibleName(new RegExp(`${eurPattern(SHIPPING.express).source}$`));

    const summary = await openOrderSummary(page);
    await expect(totalsValue(summary, 'Envío (Estándar)')).toHaveText('Gratis');
    await expect(totalsValue(summary, 'Total')).toHaveText(eurPattern(product.price));

    await shippingOption(page, 'Urgente').check();
    await expect(totalsValue(summary, 'Envío (Urgente)')).toHaveText(eurPattern(SHIPPING.express));
    await expect(totalsValue(summary, 'Total')).toHaveText(eurPattern(product.price + SHIPPING.express));
  });

  test('standard shipping is charged below the threshold', async ({ page }) => {
    const product = PRODUCTS.food;
    expect(product.price).toBeLessThan(FREE_SHIPPING_FROM);
    await seedCart(page, [{ productId: product.id, quantity: 1 }]);
    await page.goto('/checkout');
    await fillContact(page);
    await continueToShipping(page);

    const standard = shippingOption(page, 'Estándar');
    await expect(standard).toHaveAccessibleName(new RegExp(`Gratis a partir de ${eurPattern(FREE_SHIPPING_FROM).source} ${eurPattern(SHIPPING.standard).source}$`));
    await expect(shippingOption(page, 'Urgente')).toHaveAccessibleName(new RegExp(`${eurPattern(SHIPPING.express).source}$`));

    const summary = await openOrderSummary(page);
    await expect(totalsValue(summary, 'Envío (Estándar)')).toHaveText(eurPattern(SHIPPING.standard));
    await expect(totalsValue(summary, 'Total')).toHaveText(eurPattern(product.price + SHIPPING.standard));
  });
});
