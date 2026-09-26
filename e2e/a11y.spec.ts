import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { completeCheckoutSteps, continueToShipping, errorSummary, fillContact, stepForm } from './support/checkout';
import {
  PRODUCTS,
  ROUTES,
  consentBanner,
  menuButton,
  mobileMenu,
  openCartDrawer,
  openPage,
  seedCart,
  waitForAnimations,
} from './support/site';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Runs axe on the whole page and fails with a readable list of violations. */
async function expectNoViolations(page: Page) {
  await waitForAnimations(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
  expect(summary).toEqual([]);
}

test.describe('axe (WCAG 2.1 A/AA)', () => {
  for (const route of ROUTES) {
    test(`${route.path}`, async ({ page }) => {
      await openPage(page, route.path);
      await expectNoViolations(page);
    });
  }

  test('not-found page', async ({ page }) => {
    await openPage(page, '/esta-pagina-no-existe');
    await expectNoViolations(page);
  });

  test('consent banner open', async ({ page }) => {
    await page.goto('/');
    await expect(consentBanner(page)).toBeVisible();
    await expectNoViolations(page);
  });

  test('open cart drawer with a line', async ({ page }) => {
    await openPage(page, '/');
    await seedCart(page, [{ productId: PRODUCTS.firstAid.id, quantity: 2 }]);
    const drawer = await openCartDrawer(page);
    await expect(drawer.getByRole('link', { name: PRODUCTS.firstAid.name })).toBeVisible();
    await expectNoViolations(page);
  });

  test('open empty cart drawer', async ({ page }) => {
    await openPage(page, '/');
    const drawer = await openCartDrawer(page);
    await expect(drawer.getByText('Tu carrito está vacío.')).toBeVisible();
    await expectNoViolations(page);
  });

  test('open mobile menu', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The menu button only exists below the lg breakpoint');
    await openPage(page, '/');
    await menuButton(page).click();
    await expect(mobileMenu(page)).toBeVisible();
    await expectNoViolations(page);
  });

  test.describe('checkout', () => {
    test.beforeEach(async ({ page }) => {
      await openPage(page, '/');
      await seedCart(page, [{ productId: PRODUCTS.backpack24h.id, quantity: 1 }]);
      await page.goto('/checkout');
    });

    test('shipping step', async ({ page }) => {
      await fillContact(page);
      await continueToShipping(page);
      await expectNoViolations(page);
    });

    test('contact step with validation errors', async ({ page }) => {
      const form = stepForm(page, 'Contacto');
      await form.getByRole('button', { name: 'Continuar con el envío' }).click();
      await expect(errorSummary(form)).toBeVisible();
      await expectNoViolations(page);
    });

    test('shipping step with validation errors', async ({ page }) => {
      await fillContact(page);
      const form = await continueToShipping(page);
      await form.getByRole('button', { name: 'Revisar el pedido' }).click();
      await expect(errorSummary(form)).toBeVisible();
      await expectNoViolations(page);
    });

    test('review step with an order error', async ({ page }) => {
      const review = await completeCheckoutSteps(page);
      // Empty the stored cart behind the page's back so placing the order fails.
      await page.evaluate(() => window.localStorage.removeItem('bugout.cart'));
      await review.getByRole('button', { name: 'Confirmar pedido' }).click();
      await expect(review.getByRole('alert')).toContainText('No hemos podido confirmar tu pedido');
      await expectNoViolations(page);
    });

    test('order confirmation', async ({ page }) => {
      const review = await completeCheckoutSteps(page);
      await review.getByRole('button', { name: 'Confirmar pedido' }).click();
      await expect(page.getByRole('heading', { level: 1, name: /^¡Gracias/ })).toBeVisible();
      await expectNoViolations(page);
    });
  });
});
