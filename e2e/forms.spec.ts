import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { errorSummary } from './support/checkout';
import { openPage } from './support/site';

const REQUIRED = 'Este campo es obligatorio.';

/*
 * Success copy is in flux while delivery is simulated: the original "¡Gracias! Te hemos apuntado
 * a la lista." / "Mensaje enviado…" is being replaced by honest demo copy starting with "Recibido.".
 * Assert on the stable part of either wording.
 */
const NEWSLETTER_SUCCESS = /¡Gracias! Te hemos apuntado a la lista\.|Recibido\./;
const CONTACT_SUCCESS = /Mensaje enviado\. Te responderemos lo antes posible\.|Recibido\./;

function homeNewsletter(page: Page) {
  return page.getByRole('region', { name: 'Consejos de preparación en tu correo' });
}

test.describe('newsletter (home)', () => {
  test('an empty submit shows the Spanish required error', async ({ page }) => {
    await openPage(page, '/');
    const section = homeNewsletter(page);
    await section.getByRole('button', { name: 'Suscribirme' }).click();

    const email = section.getByRole('textbox', { name: 'Correo electrónico' });
    await expect(section.getByText(REQUIRED)).toBeVisible();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription(REQUIRED);
    await expect(email).toBeFocused();
  });

  test('an invalid address shows the format error', async ({ page }) => {
    await openPage(page, '/');
    const section = homeNewsletter(page);
    await section.getByRole('textbox', { name: 'Correo electrónico' }).fill('lucia@');
    await section.getByRole('button', { name: 'Suscribirme' }).click();
    await expect(section.getByText('Introduce un correo electrónico válido, por ejemplo nombre@dominio.es.')).toBeVisible();
  });

  test('a valid address subscribes', async ({ page }) => {
    await openPage(page, '/');
    const section = homeNewsletter(page);
    await section.getByRole('textbox', { name: 'Correo electrónico' }).fill('lucia.garcia@example.es');
    await section.getByRole('button', { name: 'Suscribirme' }).click();

    const confirmation = section.getByRole('status');
    await expect(confirmation).toContainText(NEWSLETTER_SUCCESS);
    await expect(section.getByRole('textbox', { name: 'Correo electrónico' })).toHaveCount(0);
    // Focus moves to the confirmation message so keyboard and screen-reader users land on it.
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.textContent?.trim() ?? ''))
      .toMatch(NEWSLETTER_SUCCESS);
    // The footer form is independent.
    await expect(page.getByRole('contentinfo').getByRole('button', { name: 'Suscribirme' })).toBeVisible();
  });
});

test.describe('contact form', () => {
  test('an empty submit lists the required fields and focuses the first one', async ({ page }) => {
    await openPage(page, '/contact');
    const form = page.getByRole('main');
    await form.getByRole('button', { name: 'Enviar mensaje' }).click();

    await expect(errorSummary(form)).toHaveText('Revisa los siguientes 4 campos:');
    for (const label of ['Nombre', 'Correo electrónico', 'Asunto', 'Mensaje']) {
      await expect(form.getByRole('link', { name: `${label}: ${REQUIRED}` })).toBeVisible();
    }
    const name = form.getByRole('textbox', { name: 'Nombre' });
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(form.getByRole('textbox', { name: 'Mensaje' })).toHaveAccessibleDescription(/Este campo es obligatorio\./);

    // The summary links move focus to their field.
    await form.getByRole('link', { name: `Asunto: ${REQUIRED}` }).click();
    await expect(form.getByRole('textbox', { name: 'Asunto' })).toBeFocused();
  });

  test('a short message is rejected with the minimum length', async ({ page }) => {
    await openPage(page, '/contact');
    const form = page.getByRole('main');
    await form.getByRole('textbox', { name: 'Nombre' }).fill('Lucía García');
    await form.getByRole('textbox', { name: 'Correo electrónico' }).fill('lucia.garcia@example.es');
    await form.getByRole('textbox', { name: 'Asunto' }).fill('Duda');
    await form.getByRole('textbox', { name: 'Mensaje' }).fill('Hola');
    await form.getByRole('button', { name: 'Enviar mensaje' }).click();

    await expect(form.getByRole('link', { name: 'Mensaje: Escribe al menos 10 caracteres.' })).toBeVisible();
    await expect(form.getByRole('textbox', { name: 'Mensaje' })).toBeFocused();
  });

  test('?topic=order preselects the topic', async ({ page }) => {
    await openPage(page, '/contact?topic=order');
    const topic = page.getByRole('main').getByRole('combobox', { name: 'Tema' });
    await expect(topic).toHaveValue('order');
    await expect(topic.locator('option:checked')).toHaveText('Mi pedido');
  });

  test('an unknown topic falls back to the general one', async ({ page }) => {
    await openPage(page, '/contact?topic=hackeo');
    await expect(page.getByRole('main').getByRole('combobox', { name: 'Tema' })).toHaveValue('general');
  });

  test('a complete message is sent', async ({ page }) => {
    await openPage(page, '/contact');
    const main = page.getByRole('main');
    await main.getByRole('textbox', { name: 'Nombre' }).fill('Lucía García');
    await main.getByRole('textbox', { name: 'Correo electrónico' }).fill('lucia.garcia@example.es');
    await main.getByRole('combobox', { name: 'Tema' }).selectOption({ label: 'Empresas y pedidos para grupos' });
    await main.getByRole('textbox', { name: 'Asunto' }).fill('Kits para una oficina');
    await main.getByRole('textbox', { name: 'Mensaje' }).fill('Necesitamos 25 mochilas de 72 horas para nuestra oficina.');
    await main.getByRole('button', { name: 'Enviar mensaje' }).click();

    const success = main.getByRole('status').filter({ hasText: CONTACT_SUCCESS });
    await expect(success).toBeVisible();
    await expect(success).toBeFocused();
    await expect(main.getByRole('button', { name: 'Enviar mensaje' })).toHaveCount(0);

    await success.getByRole('button', { name: 'Enviar otro mensaje' }).click();
    await expect(main.getByRole('textbox', { name: 'Nombre' })).toHaveValue('');
    await expect(main.getByRole('textbox', { name: 'Nombre' })).toBeFocused();
  });
});
