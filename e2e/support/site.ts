import { expect, type Locator, type Page } from '@playwright/test';

/** Every public route with its expected document title. */
export const ROUTES = [
  { path: '/', title: 'Bugout — Mochilas y kits de supervivencia' },
  { path: '/products', title: 'Productos · Bugout' },
  { path: '/products/24h-survival-backpack', title: 'Mochila de supervivencia 24H · Bugout' },
  { path: '/products/emergency-food-pack', title: 'Pack de comida de emergencia · Bugout' },
  { path: '/checkout', title: 'Finalizar compra · Bugout' },
  { path: '/about', title: 'Sobre nosotros · Bugout' },
  { path: '/contact', title: 'Contacto · Bugout' },
  { path: '/privacy', title: 'Política de privacidad · Bugout' },
  { path: '/cookies', title: 'Política de cookies · Bugout' },
  { path: '/terms', title: 'Condiciones de venta · Bugout' },
  { path: '/shipping-returns', title: 'Envíos y devoluciones · Bugout' },
] as const;

/** Catalog facts the specs rely on (mirrors src/infrastructure/data/products.json). */
export const PRODUCTS = {
  backpack24h: { id: '24h-survival-backpack', name: 'Mochila de supervivencia 24H', price: 199 },
  backpack72h: { id: '72h-survival-backpack', name: 'Mochila de supervivencia 72H', price: 299 },
  customKit: { id: 'custom-survival-kit', name: 'Kit de supervivencia personalizable', price: 149 },
  food: { id: 'emergency-food-pack', name: 'Pack de comida de emergencia', price: 49 },
  water: { id: 'water-purification-kit', name: 'Kit de potabilización de agua', price: 39 },
  firstAid: { id: 'first-aid-pro', name: 'Botiquín de primeros auxilios Pro', price: 89 },
} as const;

export const CATALOG_SIZE = Object.keys(PRODUCTS).length;
export const FREE_SHIPPING_FROM = 75;
export const SHIPPING = { standard: 4.95, express: 9.95, overnight: 14.95 } as const;
export const MAX_PER_PRODUCT = 99;

const euroFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/** "199,00 €" as the storefront formats it. */
export function eur(amount: number): string {
  return euroFormatter.format(amount);
}

/** Regex for a formatted euro amount, tolerant of the (narrow) no-break space before "€". */
export function eurPattern(amount: number): RegExp {
  const [number] = eur(amount).split(/\s/);
  return new RegExp(`${number.replace(/[.]/g, '\\.')}\\s€`);
}

/** Collapses every kind of whitespace (including NBSP) so formatted prices compare reliably. */
export function normalizeSpace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Consent banner
// ---------------------------------------------------------------------------

export function consentBanner(page: Page): Locator {
  return page.getByRole('region', { name: 'Aviso de cookies' });
}

/**
 * Rejects analytics in the consent banner. The banner only renders after hydration,
 * so once this resolves the page is interactive.
 */
export async function rejectConsent(page: Page): Promise<void> {
  const banner = consentBanner(page);
  await banner.getByRole('button', { name: 'Rechazar' }).click();
  await expect(banner).toBeHidden();
}

/** Navigates to `path` and dismisses the consent banner with "Rechazar". */
export async function openPage(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await rejectConsent(page);
}

// ---------------------------------------------------------------------------
// Shell: header, cart button and drawer, navigation
// ---------------------------------------------------------------------------

export function cartButton(page: Page): Locator {
  return page.getByRole('banner').getByRole('button', { name: /^Carrito/ });
}

export function cartDrawer(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Tu carrito' });
}

/** Accessible name of the header cart button for `count` items. */
export function cartButtonName(count: number): string {
  if (count === 0) return 'Carrito vacío';
  return `Carrito, ${count} ${count === 1 ? 'artículo' : 'artículos'}`;
}

export async function openCartDrawer(page: Page): Promise<Locator> {
  await cartButton(page).click();
  const drawer = cartDrawer(page);
  await expect(drawer).toBeVisible();
  return drawer;
}

export function cartLine(drawer: Locator, productName: string): Locator {
  return drawer
    .getByRole('list', { name: 'Productos en tu carrito' })
    .getByRole('listitem')
    .filter({ has: drawer.page().getByRole('link', { name: productName, exact: true }) });
}

export function menuButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Abrir menú' });
}

export function mobileMenu(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Menú' });
}

/**
 * The primary navigation as the viewport shows it: the header nav on desktop,
 * the menu drawer on mobile (opened on demand).
 */
export async function primaryNav(page: Page, isMobile: boolean): Promise<Locator> {
  if (isMobile) {
    await menuButton(page).click();
    const menu = mobileMenu(page);
    await expect(menu).toBeVisible();
    return menu.getByRole('navigation', { name: 'Principal' });
  }
  return page.getByRole('banner').getByRole('navigation', { name: 'Principal' });
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export const CART_KEY = 'bugout.cart';
export const CONSENT_KEY = 'bugout.consent';

export interface StoredLine {
  productId: string;
  quantity: number;
}

/**
 * Writes the cart to localStorage (the page must already be on the site's origin)
 * and reloads so the app restores it.
 */
export async function seedCart(
  page: Page,
  items: StoredLine[],
  expectedCount = items.reduce((count, item) => count + item.quantity, 0),
): Promise<void> {
  await writeStorage(page, CART_KEY, { version: 2, items });
  await page.reload();
  // The header announces the restored cart once the client has hydrated.
  await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(expectedCount));
}

export async function writeStorage(page: Page, key: string, value: unknown): Promise<void> {
  await page.evaluate(([storageKey, raw]) => window.localStorage.setItem(storageKey, raw), [key, JSON.stringify(value)] as const);
}

export async function readStorage(page: Page, key: string): Promise<unknown> {
  const raw = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), key);
  return raw === null ? null : JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** Waits until no CSS transition or animation is running (drawers slide in, toasts fade). */
export async function waitForAnimations(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running'),
  );
}

/** The <dd> that follows the <dt> with exactly `term` inside `scope`. */
export function definition(scope: Locator, term: string | RegExp): Locator {
  const pattern = typeof term === 'string' ? new RegExp(`^\\s*${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) : term;
  return scope.getByRole('term').filter({ hasText: pattern }).locator('xpath=following-sibling::dd[1]');
}

/**
 * Resolves once React has hydrated and flushed its mount effects: the header cart button
 * only opens the drawer when its handler is attached. Use it before asserting that
 * something client-rendered (like the consent banner) did NOT appear.
 */
export async function waitForHydration(page: Page): Promise<void> {
  const drawer = cartDrawer(page);
  await expect(async () => {
    await cartButton(page).click();
    await expect(drawer).toBeVisible({ timeout: 500 });
  }).toPass();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
}
