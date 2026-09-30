import type { Locator } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { CATEGORY_COUNTS, menuButton, mobileMenu, openPage, primaryNav } from './support/site';

const byLabel = (labels: string[]) => [...labels].sort((a, b) => a.localeCompare(b, 'es'));
/** The header's only top-level links; the kits and categories sit in their dropdowns. */
const TOP_LINKS = byLabel(['Kits', 'Productos', 'Prepárate']);
const KIT_LINKS = byLabel(['Kit 24h', 'Kit 72h', 'Kit Custom']);
const CATEGORY_LINKS = byLabel(Object.keys(CATEGORY_COUNTS).filter((label) => label !== 'Kits'));
// The menu drawer lists each section's links under it. Kit links are derived from the catalog, so compare sets.
const PREPARE_LINKS = byLabel([
  'Primeros 15 minutos',
  'Cómo prepararte',
  'Lista del kit de emergencia',
  'Tarjetas de acción',
  'Guía de primeros auxilios',
]);
const MENU_LINKS = byLabel([...TOP_LINKS, ...KIT_LINKS, ...CATEGORY_LINKS, ...PREPARE_LINKS]);

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
    await openPage(page, '/preparate');
    let nav = await primaryNav(page, isMobile);
    await expect.poll(() => linkLabels(nav)).toEqual(isMobile ? MENU_LINKS : TOP_LINKS);
    await expect(nav.getByRole('link', { name: 'Prepárate' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('[aria-current]')).toHaveCount(1);

    await page.goto('/products/kit-72h');
    nav = await primaryNav(page, isMobile);
    // On desktop the kit's link is in the closed Kits dropdown, so look it up by attribute.
    await expect(nav.locator('a[aria-current="page"]')).toHaveText('Kit 72h');
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

  test('hovering Kits and Productos opens their dropdowns, and a category filters the catalog', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The dropdowns are part of the desktop header');
    await openPage(page, '/about');
    const nav = page.getByRole('banner').getByRole('navigation', { name: 'Principal' });
    await expect.poll(() => linkLabels(nav)).toEqual(TOP_LINKS);

    await nav.getByRole('link', { name: 'Kits', exact: true }).hover();
    const kits = nav.locator('li', { has: page.getByRole('link', { name: 'Kits', exact: true }) }).getByRole('list');
    await expect(kits).toBeVisible();
    await expect.poll(() => linkLabels(kits)).toEqual(KIT_LINKS);

    await nav.getByRole('link', { name: 'Productos', exact: true }).hover();
    await expect(kits).toBeHidden();
    const categories = nav.locator('li', { has: page.getByRole('link', { name: 'Productos', exact: true }) }).getByRole('list');
    await expect.poll(() => linkLabels(categories)).toEqual(CATEGORY_LINKS);

    await categories.getByRole('link', { name: 'Herramientas' }).click();
    await expect(page).toHaveURL('/products?category=herramientas');
    await expect(page.getByRole('heading', { level: 1, name: 'Herramientas y equipo de supervivencia' })).toBeVisible();
    await expect(categories).toBeHidden();
    await expect(nav.locator('a[aria-current="page"]')).toHaveText('Herramientas');
  });

  test('the dropdowns open from the keyboard and close with Escape', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The dropdowns are part of the desktop header');
    await openPage(page, '/about');
    const nav = page.getByRole('banner').getByRole('navigation', { name: 'Principal' });
    const button = nav.getByRole('button', { name: 'Submenú de Kits' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(nav.getByRole('link', { name: 'Kit 24h' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
    await expect(nav.getByRole('link', { name: 'Kit 24h' })).toBeHidden();
  });

  test('the header never overlaps between 1024px and 1280px', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop widths only');
    const banner = page.getByRole('banner');
    const logo = banner.getByRole('link', { name: 'Bugout, ir al inicio' });
    const cart = banner.getByRole('button', { name: /^Carrito/ });
    const cta = banner.getByRole('link', { name: 'Compra ahora' });
    const nav = banner.getByRole('navigation', { name: 'Principal' });
    await openPage(page, '/about');
    for (const width of [1024, 1100, 1279, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      // The consent decision is stored after the first visit, so reloads show no banner.
      await page.reload();
      // Below xl the links move into the menu, which sits after the call to action.
      // The links list, not the nav: the nav stretches, while overflowing links spill out of it.
      const middle = width >= 1280 ? nav.getByRole('list') : menuButton(page);
      await expect(middle).toBeVisible();
      await expect(width >= 1280 ? menuButton(page) : nav).toBeHidden();
      const boxes = await Promise.all([logo, middle, cart, cta].map(async (element) => (await element.boundingBox())!));
      const [logoBox, middleBox, cartBox, ctaBox] = boxes;
      if (width >= 1280) {
        expect(middleBox.x, `nav starts after the logo at ${width}px`).toBeGreaterThanOrEqual(logoBox.x + logoBox.width);
        expect(middleBox.x + middleBox.width, `nav ends before the cart at ${width}px`).toBeLessThanOrEqual(cartBox.x);
      }
      expect(logoBox.x + logoBox.width, `logo before the cart at ${width}px`).toBeLessThanOrEqual(cartBox.x);
      expect(cartBox.x + cartBox.width, `cart before the call to action at ${width}px`).toBeLessThanOrEqual(ctaBox.x);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `no horizontal scroll at ${width}px`).toBeLessThanOrEqual(width);
    }
  });

  test('the mobile menu is a dialog that closes with Escape and on navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The menu button only exists below the xl breakpoint');
    await openPage(page, '/');
    await expect(page.getByRole('banner').getByRole('navigation', { name: 'Principal' })).toBeHidden();

    const button = menuButton(page);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    const menu = mobileMenu(page);
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('aria-modal', 'true');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => linkLabels(menu.getByRole('navigation', { name: 'Principal' }))).toEqual(MENU_LINKS);
    await expect(menu.getByRole('link', { name: 'Compra ahora' })).toHaveAttribute('href', '/products/kit-72h');

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();

    await button.click();
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: 'Prepárate' }).click();
    await expect(page).toHaveURL('/preparate');
    await expect(page.getByRole('heading', { level: 1, name: 'Prepárate para una emergencia' })).toBeVisible();
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
    test.skip(!isMobile, 'The menu button only exists below the xl breakpoint');
    await openPage(page, '/');
    const button = menuButton(page);
    await button.click();
    await mobileMenu(page).getByRole('button', { name: 'Cerrar' }).click();
    await expect(mobileMenu(page)).toBeHidden();
    await expect(button).toBeFocused();
  });
});
