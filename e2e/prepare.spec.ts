import { expect, test } from './support/fixtures';
import { openPage, primaryNav } from './support/site';

/** The deck's categories as the Prepárate page lists them (mirrors src/presentation/prepare/categories.ts). */
const CATEGORIES = [
  'Primeros minutos',
  'Comunicación y logística',
  'Evacuación y confinamiento',
  'Fenómenos naturales',
  'Incidentes en casa y tecnológicos',
  'Primeros auxilios',
  'Tarjetas extra',
];

test.describe('Prepárate', () => {
  test('lists every category of cards and opens a card with its steps and official sources', async ({ page }) => {
    await openPage(page, '/why-prepare');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Prepárate' })).toBeVisible();
    const cards = main.getByRole('region', { name: 'Tarjetas de acción' });
    const jump = cards.getByRole('navigation', { name: 'Categorías de tarjetas' });
    await expect(jump.getByRole('link')).toHaveText(CATEGORIES);

    await jump.getByRole('link', { name: 'Primeros auxilios' }).click();
    await expect(page).toHaveURL(/#primeros-auxilios$/);
    const firstAid = cards.getByRole('region', { name: /^Primeros auxilios/ });
    await expect(firstAid).toBeInViewport();

    await firstAid.getByRole('link', { name: /Hemorragia grave/ }).click();
    await expect(page).toHaveURL('/why-prepare/hemorragia-grave');
    await expect(page.getByRole('heading', { level: 1, name: 'Hemorragia grave' })).toBeVisible();
    await expect(main.getByRole('region', { name: 'Qué hacer' }).getByRole('listitem')).toHaveCount(6);
    await expect(main.getByRole('region', { name: 'Llama al 112 si' }).getByRole('link', { name: 'Llamar al 112' })).toHaveAttribute(
      'href',
      'tel:112',
    );
    const sources = main.getByRole('region', { name: 'Fuentes' }).getByRole('link');
    await expect(sources).toHaveCount(2);
    for (const link of await sources.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('href', /^https:\/\//);
    }
    await expect(main.getByRole('complementary').getByRole('link', { name: 'Kit 24h' })).toHaveAttribute('href', '/products/kit-24h');
  });

  test('a printed card code opens its page', async ({ page }) => {
    await openPage(page, '/why-prepare/pa-04');
    await expect(page).toHaveURL('/why-prepare/hemorragia-grave');
    await expect(page.getByRole('heading', { level: 1, name: 'Hemorragia grave' })).toBeVisible();
  });

  test('an unknown card is a 404', async ({ page }) => {
    const response = await page.goto('/why-prepare/no-existe');
    expect(response?.status()).toBe(404);
  });

  test('the header leads to the first-minutes card', async ({ page, isMobile }) => {
    await openPage(page, '/');
    const nav = await primaryNav(page, isMobile);
    if (!isMobile) await nav.getByRole('link', { name: 'Prepárate', exact: true }).hover();
    await nav.getByRole('link', { name: 'Primeros 15 minutos' }).click();
    await expect(page).toHaveURL('/why-prepare/primeros-15-minutos');
    await expect(page.getByRole('heading', { level: 1, name: 'Primeros 15 minutos' })).toBeVisible();
  });

  test('the kit page says how many cards it includes and links to them', async ({ page }) => {
    await openPage(page, '/products/kit-72h');
    const contents = page.getByRole('main').getByRole('region', { name: 'Contenido completo' });
    await expect(contents.getByRole('heading', { name: 'Incluye 50 tarjetas de acción' })).toBeVisible();
    await contents.getByRole('link', { name: /Ver las tarjetas/ }).click();
    await expect(page).toHaveURL('/why-prepare#tarjetas');
  });
});
