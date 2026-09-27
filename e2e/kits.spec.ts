import { expect, test } from './support/fixtures';
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
    await expect(main.getByRole('table', { name: 'Ficha técnica' }).getByRole('row', { name: /Para/ })).toContainText(
      twoPeople.title,
    );

    await main.getByRole('button', { name: 'Añadir al carrito' }).click();
    const drawer = cartDrawer(page);
    const line = cartLine(drawer, variantName(KITS.kit72h, twoPeople));
    await expect(line).toHaveCount(1);
    await expect(line).toContainText(`Precio por unidad: ${eur(twoPeople.price)}`, { useInnerText: true });
    await page.keyboard.press('Escape');

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
    await expect(page.getByRole('heading', { level: 2, name: '¿Cómo funciona el Kit Custom?' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('group', { name: 'Número de personas' })).toHaveCount(0);
    if (!isMobile) await expect(page.getByRole('banner').getByRole('link', { name: 'Kit Custom' })).toHaveAttribute('aria-current', 'page');
  });
});
