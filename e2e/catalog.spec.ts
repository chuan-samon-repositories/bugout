import type { Locator, Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { CATALOG_SIZE, PRODUCTS, openPage, primaryNav } from './support/site';

const ALL = Object.values(PRODUCTS);
const ACCESSORIES = [PRODUCTS.food, PRODUCTS.water, PRODUCTS.firstAid];
const KITS = [PRODUCTS.backpack24h, PRODUCTS.backpack72h, PRODUCTS.customKit];
const ON_SALE = [PRODUCTS.backpack24h, PRODUCTS.backpack72h, PRODUCTS.customKit, PRODUCTS.firstAid];

/** The filter sidebar; on mobile it is collapsed behind the "Filtros" toggle and gets expanded. */
async function filters(page: Page, isMobile: boolean): Promise<Locator> {
  const aside = page.getByRole('complementary', { name: 'Filtros' });
  if (isMobile) {
    const toggle = aside.getByRole('button', { name: /^Filtros/ });
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }
  return aside;
}

function cards(page: Page): Locator {
  return page.getByRole('main').getByRole('article');
}

function resultCount(page: Page): Locator {
  return page.getByRole('main').getByText(/^\d+ productos?$/);
}

async function expectProducts(page: Page, expected: readonly { name: string }[]) {
  await expect(resultCount(page)).toHaveText(`${expected.length} ${expected.length === 1 ? 'producto' : 'productos'}`);
  const names = cards(page).getByRole('heading');
  await expect(names).toHaveCount(expected.length);
  expect([...(await names.allInnerTexts())].sort()).toEqual(expected.map((product) => product.name).sort());
}

function categoryRadio(scope: Locator, label: string): Locator {
  return scope.getByRole('radio', { name: new RegExp(`^${label}\\b`) });
}

async function expectFullCatalogCounts(panel: Locator) {
  await expect(categoryRadio(panel, 'Todas')).toHaveAccessibleName(`Todas ${CATALOG_SIZE}`);
  await expect(categoryRadio(panel, 'Kits de supervivencia')).toHaveAccessibleName(`Kits de supervivencia ${KITS.length}`);
  await expect(categoryRadio(panel, 'Accesorios')).toHaveAccessibleName(`Accesorios ${ACCESSORIES.length}`);
}

/** Current price of each card in display order (the first euro amount in the card). */
async function cardPrices(page: Page): Promise<number[]> {
  const texts = await cards(page).allInnerTexts();
  return texts.map((text) => {
    const match = /(\d{1,3}(?:\.\d{3})*,\d{2})\s€/.exec(text);
    if (!match) throw new Error(`No price in card: ${text}`);
    return Number(match[1].replace(/\./g, '').replace(',', '.'));
  });
}

test.describe('catalog', () => {
  test('category filter updates the URL and the results; counts come from the full catalog', async ({ page, isMobile }) => {
    await openPage(page, '/products');
    await expectProducts(page, ALL);
    const panel = await filters(page, isMobile);
    await expectFullCatalogCounts(panel);

    await categoryRadio(panel, 'Accesorios').check();
    await expect(page).toHaveURL('/products?category=accessories');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Accesorios');
    await expectProducts(page, ACCESSORIES);
    await expectFullCatalogCounts(panel);

    // Narrowing further by price leaves the category counts untouched.
    await panel.getByRole('spinbutton', { name: 'Máximo' }).fill('60');
    await expect(page).toHaveURL('/products?category=accessories&max=60');
    await expectProducts(page, [PRODUCTS.food, PRODUCTS.water]);
    await expectFullCatalogCounts(panel);

    await categoryRadio(panel, 'Kits de supervivencia').check();
    await expect(page).toHaveURL('/products?category=survival-kits&max=60');
    await expect(page.getByRole('heading', { name: 'No hay productos que coincidan con estos filtros' })).toBeVisible();
    await expect(resultCount(page)).toHaveText('0 productos');
  });

  test('typing in "Máximo" keeps value and focus and updates ?max= after the debounce', async ({ page, isMobile }) => {
    await openPage(page, '/products');
    const panel = await filters(page, isMobile);
    const max = panel.getByRole('spinbutton', { name: 'Máximo' });

    await max.click();
    await max.pressSequentially('100', { delay: 60 });
    await expect(max).toHaveValue('100');
    await expect(max).toBeFocused();

    await expect(page).toHaveURL('/products?max=100');
    await expectProducts(page, ACCESSORIES);
    // The URL write must not reset or blur the field the visitor is typing in.
    await expect(max).toHaveValue('100');
    await expect(max).toBeFocused();

    await max.press('Backspace');
    await expect(page).toHaveURL('/products?max=10');
    await expect(max).toHaveValue('10');
    await expect(max).toBeFocused();
    await expect(resultCount(page)).toHaveText('0 productos');
  });

  test('filters survive a reload', async ({ page, isMobile }) => {
    await openPage(page, '/products');
    let panel = await filters(page, isMobile);
    await categoryRadio(panel, 'Kits de supervivencia').check();
    await panel.getByRole('checkbox', { name: 'Solo ofertas' }).check();
    await panel.getByRole('spinbutton', { name: 'Máximo' }).fill('250');
    await page.getByRole('main').getByRole('combobox', { name: 'Ordenar por' }).selectOption({ label: 'Precio: de mayor a menor' });
    await expect(page).toHaveURL('/products?category=survival-kits&sort=price-desc&max=250&sale=1');
    await expectProducts(page, [PRODUCTS.backpack24h, PRODUCTS.customKit]);

    await page.reload();
    panel = await filters(page, isMobile);
    await expect(categoryRadio(panel, 'Kits de supervivencia')).toBeChecked();
    await expect(panel.getByRole('checkbox', { name: 'Solo ofertas' })).toBeChecked();
    await expect(panel.getByRole('spinbutton', { name: 'Máximo' })).toHaveValue('250');
    await expect(page.getByRole('main').getByRole('combobox', { name: 'Ordenar por' })).toHaveValue('price-desc');
    await expectProducts(page, [PRODUCTS.backpack24h, PRODUCTS.customKit]);
    expect(await cardPrices(page)).toEqual([PRODUCTS.backpack24h.price, PRODUCTS.customKit.price]);
  });

  test('"Limpiar filtros" resets every filter but keeps the sort order', async ({ page, isMobile }) => {
    await openPage(page, '/products?category=accessories&min=40&max=60&sale=1&stock=1&sort=price-asc');
    const panel = await filters(page, isMobile);
    if (isMobile) {
      await expect(panel.getByRole('button', { name: /^Filtros/ })).toHaveAccessibleName(/4 filtros activos/);
    }
    await expect(resultCount(page)).toHaveText('0 productos');

    await panel.getByRole('button', { name: 'Limpiar filtros' }).click();
    await expect(page).toHaveURL('/products?sort=price-asc');
    await expectProducts(page, ALL);
    await expect(categoryRadio(panel, 'Todas')).toBeChecked();
    await expect(panel.getByRole('spinbutton', { name: 'Mínimo' })).toHaveValue('');
    await expect(panel.getByRole('spinbutton', { name: 'Máximo' })).toHaveValue('');
    await expect(panel.getByRole('checkbox', { name: 'Solo ofertas' })).not.toBeChecked();
    await expect(panel.getByRole('checkbox', { name: 'Solo en stock' })).not.toBeChecked();
    await expect(panel.getByRole('button', { name: 'Limpiar filtros' })).toHaveCount(0);
  });

  test('sorting by price ascending orders the prices', async ({ page }) => {
    await openPage(page, '/products');
    await page.getByRole('main').getByRole('combobox', { name: 'Ordenar por' }).selectOption({ label: 'Precio: de menor a mayor' });
    await expect(page).toHaveURL('/products?sort=price-asc');
    await expect(cards(page)).toHaveCount(CATALOG_SIZE);
    const prices = await cardPrices(page);
    expect(prices).toEqual(ALL.map((product) => product.price).sort((a, b) => a - b));

    await page.getByRole('main').getByRole('combobox', { name: 'Ordenar por' }).selectOption({ label: 'Precio: de mayor a menor' });
    await expect(page).toHaveURL('/products?sort=price-desc');
    await expect.poll(() => cardPrices(page)).toEqual([...prices].reverse());
  });

  test('the header "Ofertas" link shows only discounted products', async ({ page, isMobile }) => {
    await openPage(page, '/');
    const nav = await primaryNav(page, isMobile);
    await nav.getByRole('link', { name: 'Ofertas' }).click();

    await expect(page).toHaveURL('/products?sale=1');
    await expect(page).toHaveTitle('Ofertas · Bugout');
    await expectProducts(page, ON_SALE);
    for (const card of await cards(page).all()) {
      await expect(card).toContainText('Precio anterior');
      await expect(card).toContainText(/\d+ % de descuento/);
    }
    const panel = await filters(page, isMobile);
    await expect(panel.getByRole('checkbox', { name: 'Solo ofertas' })).toBeChecked();

    const current = await primaryNav(page, isMobile);
    await expect(current.getByRole('link', { name: 'Ofertas' })).toHaveAttribute('aria-current', 'page');
  });

  test('an unknown category in the URL is ignored and never echoed into the page', async ({ page }) => {
    await openPage(page, '/products?category=llama-al-900123456');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Productos');
    await expect(page).toHaveTitle('Productos · Bugout');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expectProducts(page, ALL);
    await expect(page.getByRole('main')).not.toContainText('llama');
  });

  test('a product card is a single link to its detail page', async ({ page }) => {
    await openPage(page, '/products');
    await expect(cards(page)).toHaveCount(CATALOG_SIZE);
    for (const card of await cards(page).all()) {
      const links = card.getByRole('link');
      await expect(links).toHaveCount(1);
      const name = await card.getByRole('heading').innerText();
      const product = ALL.find((candidate) => candidate.name === name);
      expect(product, `known product "${name}"`).toBeDefined();
      await expect(links).toHaveAttribute('href', `/products/${product!.id}`);
      await expect(links).toHaveAccessibleName(product!.name);
    }

    // The whole card surface is clickable, not just the title.
    const card = cards(page).filter({ has: page.getByRole('link', { name: PRODUCTS.water.name }) });
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    await card.click({ position: { x: box!.width / 2, y: 40 } });
    await expect(page).toHaveURL(`/products/${PRODUCTS.water.id}`);
    await expect(page.getByRole('heading', { level: 1, name: PRODUCTS.water.name })).toBeVisible();
  });
});
