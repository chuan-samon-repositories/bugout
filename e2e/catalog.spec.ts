import type { Locator, Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { CATALOG_SIZE, CATEGORY_COUNTS, KITS, PRODUCTS, cartDrawer, cartLine, eurPattern, openPage, primaryNav } from './support/site';

const LIGHT = ['Radio solar', 'Frontal', 'Lámpara de camping'];

/** The filter area: category chips, result count, sort and the "Más filtros" panel. */
function filterArea(page: Page): Locator {
  return page.getByRole('complementary', { name: 'Filtros' });
}

/** Opens the "Más filtros" panel (price and availability) if it is closed. */
async function moreFilters(page: Page): Promise<Locator> {
  const area = filterArea(page);
  const toggle = area.getByRole('button', { name: /^Más filtros/ });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  return area;
}

function chip(page: Page, label: string): Locator {
  return filterArea(page)
    .getByRole('navigation', { name: 'Categorías' })
    .getByRole('link', { name: new RegExp(`^${label} \\(\\d+\\)$`) });
}

function cards(page: Page): Locator {
  return page.getByRole('main').getByRole('article');
}

function resultCount(page: Page): Locator {
  return page.getByRole('main').getByText(/^\d+ productos?$/);
}

async function expectProducts(page: Page, expected: readonly string[] | number) {
  const count = typeof expected === 'number' ? expected : expected.length;
  await expect(resultCount(page)).toHaveText(`${count} ${count === 1 ? 'producto' : 'productos'}`);
  const names = cards(page).getByRole('heading');
  await expect(names).toHaveCount(count);
  if (typeof expected !== 'number') {
    expect([...(await names.allInnerTexts())].sort()).toEqual([...expected].sort());
  }
}

async function expectChipCounts(page: Page) {
  await expect(chip(page, 'Todas')).toHaveAccessibleName(`Todas (${CATALOG_SIZE})`);
  for (const [label, count] of Object.entries(CATEGORY_COUNTS)) {
    await expect(chip(page, label)).toHaveAccessibleName(`${label} (${count})`);
  }
}

/** Price of each card in display order (the first euro amount in the card, "Desde" included). */
async function cardPrices(page: Page): Promise<number[]> {
  const texts = await cards(page).allInnerTexts();
  return texts.map((text) => {
    const match = /(\d{1,3}(?:\.\d{3})*,\d{2})\s€/.exec(text);
    if (!match) throw new Error(`No price in card: ${text}`);
    return Number(match[1].replace(/\./g, '').replace(',', '.'));
  });
}

test.describe('catalog', () => {
  test('category chips filter in place, update the URL and keep the full-catalog counts', async ({ page }) => {
    await openPage(page, '/products');
    await expectProducts(page, CATALOG_SIZE);
    await expectChipCounts(page);
    await expect(chip(page, 'Todas')).toHaveAttribute('aria-current', 'page');

    await chip(page, 'Luz y energía').click();
    await expect(page).toHaveURL('/products?category=luz-y-energia');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Luz y energía');
    await expect(chip(page, 'Luz y energía')).toHaveAttribute('aria-current', 'page');
    await expectProducts(page, LIGHT);
    await expectChipCounts(page);

    // Narrowing further by price leaves the category counts untouched.
    const panel = await moreFilters(page);
    await panel.getByRole('spinbutton', { name: 'Máximo' }).fill('20');
    await expect(page).toHaveURL('/products?category=luz-y-energia&max=20');
    await expectProducts(page, ['Frontal', 'Lámpara de camping']);
    await expectChipCounts(page);

    await chip(page, 'Kits').click();
    await expect(page).toHaveURL('/products?category=kits&max=20');
    await expect(page.getByRole('heading', { name: 'No hay productos que coincidan con estos filtros' })).toBeVisible();
    await expect(resultCount(page)).toHaveText('0 productos');
  });

  test('typing in "Máximo" keeps value and focus and updates ?max= after the debounce', async ({ page }) => {
    await openPage(page, '/products');
    const panel = await moreFilters(page);
    const max = panel.getByRole('spinbutton', { name: 'Máximo' });

    await max.click();
    await max.pressSequentially('10', { delay: 60 });
    await expect(max).toHaveValue('10');
    await expect(max).toBeFocused();

    await expect(page).toHaveURL('/products?max=10');
    await expectProducts(page, ['Manta térmica', 'Poncho térmico', 'Cuerda de paracaidismo', 'Silbato', 'Bolsa hermética para documentos', 'Cinta adhesiva táctica']);
    // The URL write must not reset or blur the field the visitor is typing in.
    await expect(max).toHaveValue('10');
    await expect(max).toBeFocused();

    await max.press('Backspace');
    await expect(page).toHaveURL('/products?max=1');
    await expect(max).toHaveValue('1');
    await expect(max).toBeFocused();
    await expect(resultCount(page)).toHaveText('0 productos');
  });

  test('filters survive a reload', async ({ page }) => {
    await openPage(page, '/products');
    await chip(page, 'Herramientas').click();
    let panel = await moreFilters(page);
    await panel.getByRole('spinbutton', { name: 'Máximo' }).fill('20');
    await panel.getByRole('combobox', { name: 'Ordenar por' }).selectOption({ label: 'Precio: de mayor a menor' });
    await expect(page).toHaveURL('/products?category=herramientas&sort=price-desc&max=20');
    await expectProducts(page, 6);
    expect(await cardPrices(page)).toEqual([19, 15, 8, 8, 6, 5]);

    await page.reload();
    await expect(chip(page, 'Herramientas')).toHaveAttribute('aria-current', 'page');
    panel = await moreFilters(page);
    await expect(panel.getByRole('spinbutton', { name: 'Máximo' })).toHaveValue('20');
    await expect(panel.getByRole('combobox', { name: 'Ordenar por' })).toHaveValue('price-desc');
    expect(await cardPrices(page)).toEqual([19, 15, 8, 8, 6, 5]);
  });

  test('"Limpiar filtros" resets every filter but keeps the sort order', async ({ page }) => {
    await openPage(page, '/products?category=herramientas&min=40&max=60&stock=1&sort=price-asc');
    const toggle = filterArea(page).getByRole('button', { name: /^Más filtros/ });
    await expect(toggle).toHaveAccessibleName(/2 filtros activos/);
    await expectProducts(page, [PRODUCTS.backpack30l.name]);

    const panel = await moreFilters(page);
    await panel.getByRole('button', { name: 'Limpiar filtros' }).click();
    await expect(page).toHaveURL('/products?sort=price-asc');
    await expectProducts(page, CATALOG_SIZE);
    await expect(chip(page, 'Todas')).toHaveAttribute('aria-current', 'page');
    await expect(panel.getByRole('spinbutton', { name: 'Mínimo' })).toHaveValue('');
    await expect(panel.getByRole('spinbutton', { name: 'Máximo' })).toHaveValue('');
    await expect(panel.getByRole('checkbox', { name: 'Solo en stock' })).not.toBeChecked();
    await expect(panel.getByRole('button', { name: 'Limpiar filtros' })).toHaveCount(0);
  });

  test('sorting by price orders the cards, kits by their starting price', async ({ page }) => {
    await openPage(page, '/products');
    const sort = filterArea(page).getByRole('combobox', { name: 'Ordenar por' });
    await sort.selectOption({ label: 'Precio: de menor a mayor' });
    await expect(page).toHaveURL('/products?sort=price-asc');
    await expect(cards(page)).toHaveCount(CATALOG_SIZE);
    const prices = await cardPrices(page);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(prices).toContain(KITS.kit72h.variants[0].price);

    await sort.selectOption({ label: 'Precio: de mayor a menor' });
    await expect(page).toHaveURL('/products?sort=price-desc');
    await expect.poll(() => cardPrices(page)).toEqual([...prices].reverse());
  });

  test('the "Productos" navigation link opens the catalog and is marked current', async ({ page, isMobile }) => {
    await openPage(page, '/');
    const nav = await primaryNav(page, isMobile);
    await nav.getByRole('link', { name: 'Productos' }).click();
    await expect(page).toHaveURL('/products');
    await expect(page).toHaveTitle('Productos · Bugout');
    const current = await primaryNav(page, isMobile);
    await expect(current.getByRole('link', { name: 'Productos' })).toHaveAttribute('aria-current', 'page');
  });

  test('an unknown category in the URL is ignored and never echoed into the page', async ({ page }) => {
    await openPage(page, '/products?category=llama-al-900123456');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Productos');
    await expect(page).toHaveTitle('Productos · Bugout');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expectProducts(page, CATALOG_SIZE);
    await expect(page.getByRole('main')).not.toContainText('llama');
  });

  test('each card has one link to its page; the whole card surface is clickable', async ({ page }) => {
    await openPage(page, '/products');
    await expect(cards(page)).toHaveCount(CATALOG_SIZE);
    for (const card of await cards(page).all()) {
      const links = card.getByRole('link');
      await expect(links).toHaveCount(1);
      await expect(links).toHaveAttribute('href', /^\/products\/[a-z0-9-]+$/);
      await expect(links).toHaveAccessibleName(await card.getByRole('heading').innerText());
    }

    const card = cards(page).filter({ has: page.getByRole('link', { name: PRODUCTS.canteen.name }) });
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    await card.click({ position: { x: box!.width / 2, y: 40 } });
    await expect(page).toHaveURL(`/products/${PRODUCTS.canteen.id}`);
    await expect(page.getByRole('heading', { level: 1, name: PRODUCTS.canteen.name })).toBeVisible();
  });

  test('cards show the kits a product belongs to and add loose products in one click', async ({ page }) => {
    await openPage(page, '/products');
    const blanket = cards(page).filter({ has: page.getByRole('link', { name: 'Manta térmica' }) });
    await expect(blanket.getByRole('list', { name: 'Incluido en' }).getByRole('listitem')).toHaveText([
      'Incluido en el Kit 24h',
      'Incluido en el Kit 72h',
    ]);

    const kit = cards(page).filter({ has: page.getByRole('link', { name: KITS.kit72h.name, exact: true }) });
    await expect(kit).toContainText('Desde 119,00');
    await expect(kit.getByRole('button')).toHaveCount(0);
    // The build-your-own base is a starting price too, as on its kit card and page.
    const custom = cards(page).filter({ has: page.getByRole('link', { name: KITS.kitCustom.name, exact: true }) });
    await expect(custom).toContainText(new RegExp(`Desde ${eurPattern(KITS.kitCustom.variants[0].price).source}`));

    const quickAdd = page.getByRole('button', { name: `Añadir ${PRODUCTS.radio.name} al carrito` });
    await quickAdd.click();
    const drawer = cartDrawer(page);
    await expect(drawer).toBeVisible();
    await expect(cartLine(drawer, PRODUCTS.radio.name)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(quickAdd).toBeFocused();
  });

  test('product cards fit two per row at 360px without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openPage(page, '/products');
    await expect(cards(page).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'no horizontal scroll').toBeLessThanOrEqual(0);
    for (const card of (await cards(page).all()).slice(0, 6)) {
      const cardBox = (await card.boundingBox())!;
      const button = card.getByRole('button');
      if ((await button.count()) === 0) continue;
      const buttonBox = (await button.boundingBox())!;
      expect(buttonBox.x + buttonBox.width, 'quick add stays inside its card').toBeLessThanOrEqual(cardBox.x + cardBox.width);
    }
  });
});
