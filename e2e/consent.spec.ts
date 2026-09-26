import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { CONSENT_KEY, consentBanner, readStorage, waitForHydration } from './support/site';

/** Records every request that would reach PostHog, directly or through the /ingest proxy. */
function watchAnalyticsRequests(page: Page): string[] {
  const hits: string[] = [];
  page.context().on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/ingest') || url.hostname.endsWith('posthog.com')) hits.push(request.url());
  });
  return hits;
}

test.describe('consent banner', () => {
  test('is shown on the first visit with equally sized choices', async ({ page }) => {
    await page.goto('/');
    const banner = consentBanner(page);
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('cookies de analítica');
    await expect(banner.getByRole('link', { name: 'Más información sobre cookies' })).toHaveAttribute('href', '/cookies');

    const reject = banner.getByRole('button', { name: 'Rechazar' });
    const accept = banner.getByRole('button', { name: 'Aceptar' });
    await expect(reject).toBeVisible();
    await expect(accept).toBeVisible();
    const [rejectBox, acceptBox] = [await reject.boundingBox(), await accept.boundingBox()];
    expect(rejectBox && acceptBox).toBeTruthy();
    expect(Math.abs(rejectBox!.width - acceptBox!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(rejectBox!.height - acceptBox!.height)).toBeLessThanOrEqual(1);
    // Neither choice is visually favoured: both buttons share the same styling.
    expect(await reject.getAttribute('class')).toBe(await accept.getAttribute('class'));
  });

  for (const choice of [
    { button: 'Rechazar', analytics: false },
    { button: 'Aceptar', analytics: true },
  ] as const) {
    test(`"${choice.button}" persists across reloads and navigation`, async ({ page }) => {
      const analyticsRequests = watchAnalyticsRequests(page);
      await page.goto('/');
      const banner = consentBanner(page);
      await banner.getByRole('button', { name: choice.button }).click();
      await expect(banner).toBeHidden();

      await expect.poll(() => readStorage(page, CONSENT_KEY)).toMatchObject({ analytics: choice.analytics });

      for (const path of ['/', '/products', '/about']) {
        await page.goto(path);
        // The banner is client-rendered: only a hydrated page can prove it stays closed.
        await waitForHydration(page);
        await expect(banner).toBeHidden();
      }
      await page.waitForLoadState('networkidle');

      // No PostHog key in the default build: nothing may reach the analytics proxy.
      expect(analyticsRequests).toEqual([]);
      expect(await page.context().cookies()).toEqual([]);
    });
  }

  test('"Configurar cookies" in the footer reopens the banner', async ({ page }) => {
    await page.goto('/contact');
    const banner = consentBanner(page);
    await banner.getByRole('button', { name: 'Aceptar' }).click();
    await expect(banner).toBeHidden();

    await page.getByRole('contentinfo').getByRole('button', { name: 'Configurar cookies' }).click();
    await expect(banner).toBeVisible();

    await banner.getByRole('button', { name: 'Rechazar' }).click();
    await expect(banner).toBeHidden();
    await expect.poll(() => readStorage(page, CONSENT_KEY)).toMatchObject({ analytics: false });

    await page.reload();
    await waitForHydration(page);
    await expect(banner).toBeHidden();
  });

  test('the cookie policy page can reopen the banner', async ({ page }) => {
    await page.goto('/cookies');
    const banner = consentBanner(page);
    await banner.getByRole('button', { name: 'Rechazar' }).click();
    await expect(banner).toBeHidden();
    await page.getByRole('main').getByRole('button', { name: 'Cambiar preferencias de cookies' }).click();
    await expect(banner).toBeVisible();
  });

  test('no request goes to /ingest before, during or after any choice', async ({ page }) => {
    const analyticsRequests = watchAnalyticsRequests(page);
    await page.goto('/');
    await expect(consentBanner(page)).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(analyticsRequests, 'before a choice').toEqual([]);

    await consentBanner(page).getByRole('button', { name: 'Aceptar' }).click();
    await page.goto('/products/24h-survival-backpack');
    await page.getByRole('main').getByRole('button', { name: 'Añadir al carrito' }).click();
    await expect(page.getByRole('dialog', { name: 'Tu carrito' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(analyticsRequests, 'after accepting').toEqual([]);

    await page.getByRole('dialog', { name: 'Tu carrito' }).getByRole('button', { name: 'Cerrar' }).click();
    await page.getByRole('contentinfo').getByRole('button', { name: 'Configurar cookies' }).click();
    await consentBanner(page).getByRole('button', { name: 'Rechazar' }).click();
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    expect(analyticsRequests, 'after rejecting').toEqual([]);
    expect(await page.context().cookies()).toEqual([]);
  });
});
