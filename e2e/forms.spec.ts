import { expect, test } from './support/fixtures';
import { completeCheckoutSteps, stepForm } from './support/checkout';
import { PRODUCTS, openPage, seedCart } from './support/site';

/*
 * The newsletter and the contact form only simulate delivery until a mail/CRM backend is connected
 * (`isMessagingSimulated()`), so the default build hides them (`isMessagingEnabled()` is false).
 * Their behaviour once enabled is covered by the unit tests (NewsletterForm, ContactForm, Footer, home
 * page, contact page, checkout).
 */

test.describe('newsletter (hidden while messaging is disabled)', () => {
  test('neither the home page nor the footer offers a sign-up', async ({ page }) => {
    await openPage(page, '/');
    await expect(page.getByRole('region', { name: 'Consejos de preparación en tu correo' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Suscribirme' })).toHaveCount(0);

    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('heading', { name: 'Recibe novedades' })).toHaveCount(0);
    await expect(footer.getByRole('textbox')).toHaveCount(0);
    // The link columns and the copyright are still there.
    for (const column of ['Tienda', 'Ayuda', 'Empresa', 'Legal']) {
      await expect(footer.getByRole('heading', { level: 2, name: column })).toBeVisible();
    }
    await expect(footer.getByText(/Todos los derechos reservados/)).toBeVisible();
  });

  test('the checkout does not offer the marketing opt-in', async ({ page }) => {
    await openPage(page, '/');
    await seedCart(page, [{ productId: PRODUCTS.backpack65l.id, quantity: 1 }]);
    await page.goto('/checkout');
    await expect(stepForm(page, 'Contacto')).toBeVisible();
    await expect(page.getByRole('main').getByRole('checkbox')).toHaveCount(0);

    const review = await completeCheckoutSteps(page);
    await expect(review).not.toContainText('novedades');
  });
});

test.describe('contact page (form hidden while messaging is disabled)', () => {
  test('shows the quick help and the FAQ, but no form', async ({ page }) => {
    await openPage(page, '/contact');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Contacto' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Enviar mensaje' })).toHaveCount(0);
    await expect(main.getByRole('textbox')).toHaveCount(0);
    await expect(main.getByRole('combobox')).toHaveCount(0);
    await expect(main).not.toContainText(/formulario de contacto|Escríbenos|Modo demostración/);

    await expect(main.getByRole('heading', { level: 2, name: 'Información útil' })).toBeVisible();
    await expect(main.getByText('Enviamos a la España peninsular y a las islas Baleares.', { exact: true })).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'Preguntas frecuentes' })).toBeVisible();

    // FAQ answers expand and link on.
    await main.getByText('¿Puedo devolver un pedido?').click();
    const returnsLink = main.getByRole('link', { name: 'Envíos y devoluciones', exact: true });
    await expect(returnsLink).toBeVisible();
    await returnsLink.click();
    await expect(page).toHaveURL('/shipping-returns');
  });

  test('?topic= is ignored and the page still renders', async ({ page }) => {
    const response = await page.goto('/contact?topic=order');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Contacto' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('combobox')).toHaveCount(0);
  });

  test('legal pages point to the contact page without mentioning a form', async ({ page }) => {
    await openPage(page, '/shipping-returns');
    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: 'formulario de contacto' })).toHaveCount(0);
    const contactLinks = main.getByRole('link', { name: 'página de contacto' });
    await expect(contactLinks.first()).toHaveAttribute('href', '/contact');
    await contactLinks.first().click();
    await expect(page).toHaveURL('/contact');
    await expect(page.getByRole('heading', { level: 1, name: 'Contacto' })).toBeVisible();
  });
});
