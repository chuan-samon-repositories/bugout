import { expect, test, type Page } from './support/fixtures';
import { continueToReview, continueToShipping, fillAddress, fillContact } from './support/checkout';
import {
  CART_KEY,
  KITS,
  PRODUCTS,
  cartButton,
  cartButtonName,
  cartDrawer,
  cartLine,
  eur,
  openPage,
  readStorage,
  variantName,
} from './support/site';

const [onePerson, twoPeople, fourPeople] = KITS.kit72h.variants;

test.describe('kits', () => {
  test('choosing the number of people changes the price and adds that variant to the cart', async ({ page }) => {
    await openPage(page, `/products/${KITS.kit72h.slug}`);
    const main = page.getByRole('main');
    const people = main.getByRole('group', { name: 'Número de personas' });
    await expect(people.getByRole('radio')).toHaveCount(3);
    await expect(people.getByRole('radio', { name: onePerson.title })).toBeChecked();
    await expect(main.getByText(eur(onePerson.price), { exact: true })).toBeVisible();

    await people.getByText(twoPeople.title, { exact: true }).click();
    await expect(people.getByRole('radio', { name: twoPeople.title })).toBeChecked();
    await expect(main.getByText(eur(twoPeople.price), { exact: true })).toBeVisible();
    // The specs are the 1-person version's whatever is selected, and the caption says so.
    const specs = main.getByRole('table', { name: `Ficha técnica de la versión para ${onePerson.title}` });
    await expect(specs).toBeVisible();
    await expect(specs.getByRole('row', { name: /Para/ })).toHaveCount(0);

    const add = main.getByRole('button', { name: 'Añadir al carrito' });
    await add.click();
    const drawer = cartDrawer(page);
    const line = cartLine(drawer, variantName(KITS.kit72h, twoPeople));
    await expect(line).toHaveCount(1);
    await expect(line).toContainText(`Precio por unidad: ${eur(twoPeople.price)}`, { useInnerText: true });
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    // The button stays focusable while adding, so the drawer hands focus back to it.
    await expect(add).toBeFocused();

    // Another size is another cart line.
    await people.getByText(fourPeople.title, { exact: true }).click();
    await main.getByRole('button', { name: 'Añadir al carrito' }).click();
    await expect(cartLine(drawer, variantName(KITS.kit72h, fourPeople))).toHaveCount(1);
    await expect(cartLine(drawer, variantName(KITS.kit72h, twoPeople))).toHaveCount(1);
    await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(2));
    expect(await readStorage(page, CART_KEY)).toStrictEqual({
      version: 2,
      items: [
        { productId: twoPeople.id, quantity: 1 },
        { productId: fourPeople.id, quantity: 1 },
      ],
    });
  });

  test('a kit variant goes through checkout under its full name', async ({ page }) => {
    const kit = KITS.kit24h;
    const [, variant] = kit.variants;
    await openPage(page, `/products/${kit.slug}`);
    await page.getByRole('main').getByRole('group', { name: 'Número de personas' }).getByText(variant.title, { exact: true }).click();
    await page.getByRole('main').getByRole('button', { name: 'Añadir al carrito' }).click();
    await cartDrawer(page).getByRole('button', { name: 'Finalizar compra' }).click();
    await expect(page).toHaveURL('/checkout');

    await expect(page.getByRole('complementary', { name: 'Resumen del pedido' })).toContainText(variantName(kit, variant));
    await fillContact(page);
    await continueToShipping(page);
    await fillAddress(page);
    await continueToReview(page);
    await page.getByRole('button', { name: 'Confirmar pedido' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /^¡Gracias/ })).toBeVisible();
    await expect(page.getByRole('main')).toContainText(variantName(kit, variant));
  });

  test('the kit page lists its contents with links to the loose products', async ({ page }) => {
    await openPage(page, `/products/${KITS.kit72h.slug}`);
    const contents = page.getByRole('region', { name: 'Contenido completo' });
    await contents.getByRole('link', { name: PRODUCTS.radio.name }).click();
    await expect(page).toHaveURL(`/products/${PRODUCTS.radio.id}`);
    const included = page.getByRole('main').getByRole('list', { name: 'Incluido en' }).first();
    await expect(included.getByRole('link', { name: `Incluido en el ${KITS.kit72h.name}` })).toHaveAttribute(
      'href',
      `/products/${KITS.kit72h.slug}`,
    );
  });

  test('"Cómo elegir" compares the kits and links to each one', async ({ page, isMobile }) => {
    await openPage(page, '/');
    const home = page.getByRole('main');
    await home.getByRole('link', { name: /Ver la comparativa completa/ }).click();
    await expect(page).toHaveURL('/how-to-choose');
    const table = page.getByRole('table', { name: 'Comparativa de los kits' });
    await expect(table.getByRole('columnheader')).toHaveText(['Característica', KITS.kit24h.name, KITS.kit72h.name]);
    await expect(table.getByRole('row', { name: /Personas/ })).toContainText('1, 2 o 4');

    await page.getByRole('link', { name: `Ver el kit: ${KITS.kitCustom.name}` }).click();
    await expect(page).toHaveURL(`/products/${KITS.kitCustom.slug}`);
    await expect(page.getByRole('heading', { level: 2, name: 'Monta tu kit' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('group', { name: 'Número de personas' })).toHaveCount(0);
    if (!isMobile) await expect(page.getByRole('banner').getByRole('link', { name: 'Kit Custom' })).toHaveAttribute('aria-current', 'page');
  });

  test('the Kit Custom builder puts the backpack and the chosen products in the cart at once', async ({ page }) => {
    await openPage(page, `/products/${KITS.kitCustom.slug}`);
    const main = page.getByRole('main');
    // The kit itself is not sold: the page leads to the builder.
    await main.getByRole('link', { name: 'Montar mi kit' }).click();
    await expect(page).toHaveURL(/#kit-builder$/);
    const builder = main.getByRole('region', { name: 'Monta tu kit' });
    const summary = builder.getByRole('complementary', { name: 'Tu kit' });
    await expect(builder.getByRole('heading', { level: 2, name: 'Monta tu kit' })).toBeInViewport();

    await builder.getByText(PRODUCTS.backpack65l.name, { exact: true }).click();
    await expect(builder.getByRole('radio', { name: new RegExp(PRODUCTS.backpack65l.name) })).toBeChecked();

    // The Kit 24h's loose products, without the water and food it also includes.
    await builder.getByRole('button', { name: `Partir del ${KITS.kit24h.name}` }).click();
    await expect(builder.getByText(/No se venden por separado o están agotados: Barritas energéticas/)).toBeVisible();
    await builder.getByRole('button', { name: `Quitar una unidad de ${PRODUCTS.firstAid.name}` }).click();
    await builder.getByRole('button', { name: `Añadir una unidad de ${PRODUCTS.radio.name}` }).click();

    // 65L backpack 89 + manta 6 + poncho 9 + silbato 5 + frontal 14 + cantimplora 12 + radio 24
    await expect(summary).toContainText('7 productos · 7 unidades');
    await expect(summary.getByText(eur(159), { exact: true })).toBeVisible();

    const add = summary.getByRole('button', { name: 'Añadir al carrito' });
    await add.click();
    const drawer = cartDrawer(page);
    await expect(drawer).toBeVisible();
    for (const name of [PRODUCTS.backpack65l.name, PRODUCTS.headlamp.name, PRODUCTS.radio.name, PRODUCTS.canteen.name]) {
      await expect(cartLine(drawer, name)).toHaveCount(1);
    }
    await expect(cartLine(drawer, PRODUCTS.firstAid.name)).toHaveCount(0);
    await expect(cartButton(page)).toHaveAccessibleName(cartButtonName(7));
    const stored = (await readStorage(page, CART_KEY)) as { items: unknown[] } | null;
    expect(stored?.items).toHaveLength(7);

    // Closing the drawer returns focus to the builder, which starts over without a second backpack.
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(add).toBeFocused();
    await expect(summary).toContainText('Hemos añadido 7 productos al carrito.');
    await expect(builder.getByRole('radio', { name: /Ya tengo mochila/ })).toBeChecked();
    await expect(add).toHaveAttribute('aria-disabled', 'true');
  });
});

test.describe('home kit cards', () => {
  const kitCard = (page: Page, name: string) =>
    page
      .getByRole('region', { name: 'Elige según el tiempo que necesites aguantar' })
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name, exact: true }) });

  test('the Kit 24h and Kit 72h cards show their backpacks instead of a coloured header', async ({ page }) => {
    await openPage(page, '/');
    for (const kit of [KITS.kit24h, KITS.kit72h]) {
      const turntable = kitCard(page, kit.name).locator('[data-turntable]');
      await turntable.scrollIntoViewIfNeeded();
      // Reduced motion (the project default) keeps the still picture of the backpack.
      await expect(turntable).toHaveAttribute('data-turntable', 'poster');
      const poster = turntable.locator('img');
      await expect(poster).toBeVisible();
      await expect.poll(() => poster.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
    }
    await expect(kitCard(page, KITS.kitCustom.name).locator('[data-turntable]')).toHaveCount(0);
  });

  test.describe('with motion allowed', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } });

    test('the backpacks turn in 3D where WebGL works and stay still where it does not', async ({ page, problems }) => {
      await openPage(page, '/');
      const webgl = await page.evaluate(() => document.createElement('canvas').getContext('webgl') !== null);
      for (const kit of [KITS.kit24h, KITS.kit72h]) {
        const turntable = kitCard(page, kit.name).locator('[data-turntable]');
        await turntable.scrollIntoViewIfNeeded();
        await expect(turntable).toHaveAttribute('data-turntable', webgl ? 'turning' : 'poster');
      }
      expect(problems.pageErrors).toEqual([]);
    });
  });
});
