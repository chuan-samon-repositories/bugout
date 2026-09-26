import { expect, test } from './support/fixtures';
import { ROUTES, rejectConsent } from './support/site';

test.describe('every route', () => {
  for (const route of ROUTES) {
    test(`${route.path} renders a healthy Spanish page`, async ({ page, problems }) => {
      const response = await page.goto(route.path);
      expect(response?.status(), 'HTTP status').toBe(200);

      // The consent banner appears after hydration; dismissing it proves the page is interactive.
      await rejectConsent(page);

      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      await expect(page).toHaveTitle(route.title);
      if (route.path === '/') {
        await expect(page).toHaveTitle(/^Bugout — /);
      } else {
        await expect(page).toHaveTitle(/ · Bugout$/);
      }
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollWidth, 'no horizontal overflow').toBeLessThanOrEqual(overflow.clientWidth);

      expect(problems.pageErrors, 'uncaught page errors').toEqual([]);
      expect(problems.consoleErrors, 'console errors').toEqual([]);
    });
  }

  test('document titles are unique', async ({ request }) => {
    const titles: string[] = [];
    for (const route of ROUTES) {
      const html = await (await request.get(route.path)).text();
      titles.push(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '');
    }
    expect(titles).toEqual(ROUTES.map((route) => route.title));
    expect(new Set(titles).size).toBe(titles.length);
  });
});

test.describe('not found', () => {
  for (const path of ['/products/producto-que-no-existe', '/esta-pagina-no-existe']) {
    test(`${path} returns the Spanish 404 page`, async ({ page, problems }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await rejectConsent(page);

      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      await expect(page).toHaveTitle('Página no encontrada · Bugout');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeVisible();
      await expect(page.getByText('La página que buscas no existe o se ha movido.')).toBeVisible();
      await expect(page.getByRole('main').getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
      await expect(page.getByRole('main').getByRole('link', { name: 'Ver todos los productos' })).toHaveAttribute(
        'href',
        '/products',
      );
      expect(problems.pageErrors).toEqual([]);
    });
  }
});
