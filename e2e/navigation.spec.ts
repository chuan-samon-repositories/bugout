import type { Locator } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { menuButton, mobileMenu, openPage, primaryNav } from './support/site';

// Kit links are derived from the catalog, so compare the set of labels, not their order.
const NAV_LINKS = ['Cómo elegir', 'Kit 24h', 'Kit 72h', 'Kit Custom', 'Prepárate', 'Productos', 'Sobre nosotros'];

async function linkLabels(scope: Locator): Promise<string[]> {
  return (await scope.getByRole('link').allInnerTexts()).map((label) => label.trim()).sort((a, b) => a.localeCompare(b, 'es'));
}

test.describe('navigation', () => {
  test('the skip link is the first Tab stop and moves focus to the main content', async ({ page }) => {
    await openPage(page, '/about');
    // Reload so focus starts from the top of a fresh document (consent is remembered).
    await page.reload();
    await expect(page.getByRole('banner').getByRole('button', { name: /^Carrito/ })).toBeVisible();

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Saltar al contenido' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await expect(skip).toHaveAttribute('href', '#main-content');

    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
    await expect(page).toHaveURL(/#main-content$/);
  });

  test('the primary navigation marks the current page', async ({ page, isMobile }) => {
    await openPage(page, '/about');
    let nav = await primaryNav(page, isMobile);
    await expect.poll(() => linkLabels(nav)).toEqual(NAV_LINKS);
    await expect(nav.getByRole('link', { name: 'Sobre nosotros' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('[aria-current]')).toHaveCount(1);

    await page.goto('/products/kit-72h');
    nav = await primaryNav(page, isMobile);
    await expect(nav.getByRole('link', { name: 'Kit 72h' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Productos' })).not.toHaveAttribute('aria-current', /.*/);
    await expect(nav.locator('[aria-current]')).toHaveCount(1);

    await page.goto('/products?sort=price-asc');
    nav = await primaryNav(page, isMobile);
    await expect(nav.getByRole('link', { name: 'Productos' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('[aria-current]')).toHaveCount(1);
  });

  test('desktop header shows the navigation and no menu button', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-only layout');
    await openPage(page, '/');
    await expect(page.getByRole('banner').getByRole('navigation', { name: 'Principal' })).toBeVisible();
    await expect(menuButton(page)).toBeHidden();
  });

  test('the mobile menu is a dialog that closes with Escape and on navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The menu button only exists below the lg breakpoint');
    await openPage(page, '/');
    await expect(page.getByRole('banner').getByRole('navigation', { name: 'Principal' })).toBeHidden();

    const button = menuButton(page);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    const menu = mobileMenu(page);
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('aria-modal', 'true');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => linkLabels(menu.getByRole('navigation', { name: 'Principal' }))).toEqual(NAV_LINKS);
    await expect(menu.getByRole('link', { name: 'Compra ahora' })).toHaveAttribute('href', '/products/kit-72h');

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();

    await button.click();
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: 'Sobre nosotros' }).click();
    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { level: 1, name: 'Sobre nosotros' })).toBeVisible();
    await expect(menu).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');

    await button.click();
    await menu.getByRole('link', { name: 'Kit 24h' }).click();
    await expect(page).toHaveURL('/products/kit-24h');
    await expect(page.getByRole('heading', { level: 1, name: 'Kit 24h' })).toBeVisible();
    await expect(menu).toBeHidden();
  });

  test('the header is transparent over the home hero and turns solid on scroll', async ({ page }) => {
    await openPage(page, '/');
    const header = page.getByRole('banner');
    await expect(header).toHaveAttribute('data-transparent', 'true');
    await page.mouse.wheel(0, 600);
    await expect(header).not.toHaveAttribute('data-transparent', /.*/);

    await page.goto('/about');
    await expect(page.getByRole('banner')).not.toHaveAttribute('data-transparent', /.*/);
  });

  test('"Compra ahora" opens the flagship kit', async ({ page, isMobile }) => {
    await openPage(page, '/about');
    if (isMobile) await menuButton(page).click();
    const scope = isMobile ? mobileMenu(page) : page.getByRole('banner');
    await scope.getByRole('link', { name: 'Compra ahora' }).click();
    await expect(page).toHaveURL('/products/kit-72h');
    await expect(page.getByRole('heading', { level: 1, name: 'Kit 72h' })).toBeVisible();
  });

  test('the close button of the mobile menu restores focus', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The menu button only exists below the lg breakpoint');
    await openPage(page, '/');
    const button = menuButton(page);
    await button.click();
    await mobileMenu(page).getByRole('button', { name: 'Cerrar' }).click();
    await expect(mobileMenu(page)).toBeHidden();
    await expect(button).toBeFocused();
  });
});
