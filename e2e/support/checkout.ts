import { expect, type Locator, type Page } from '@playwright/test';
import { definition } from './site';

export const CUSTOMER = {
  email: 'lucia.garcia@example.es',
  firstName: 'Lucía',
  lastName: 'García Pérez',
} as const;

export const ADDRESS = {
  address: 'Calle de Alcalá 20, 3.º B',
  postalCode: '28013',
  city: 'Madrid',
  province: 'Madrid',
} as const;

/** The form of the current checkout step, named by its heading ("Contacto", "Envío", "Revisión"). */
export function stepForm(page: Page, step: 'Contacto' | 'Envío' | 'Revisión'): Locator {
  return page.getByRole('main').getByRole('form', { name: step });
}

export function errorSummary(scope: Locator | Page): Locator {
  return scope.getByText(/^Revisa (el siguiente campo|los siguientes \d+ campos):$/);
}

export async function fillContact(page: Page, customer: { email: string; firstName: string; lastName: string } = CUSTOMER) {
  const form = stepForm(page, 'Contacto');
  await expect(form).toBeVisible();
  await form.getByRole('textbox', { name: 'Correo electrónico' }).fill(customer.email);
  await form.getByRole('textbox', { name: 'Nombre', exact: true }).fill(customer.firstName);
  await form.getByRole('textbox', { name: 'Apellidos' }).fill(customer.lastName);
}

export async function continueToShipping(page: Page): Promise<Locator> {
  await stepForm(page, 'Contacto').getByRole('button', { name: 'Continuar con el envío' }).click();
  const form = stepForm(page, 'Envío');
  await expect(form).toBeVisible();
  return form;
}

export async function fillAddress(page: Page, address: { address: string; postalCode: string; city: string; province: string } = ADDRESS) {
  const form = stepForm(page, 'Envío');
  await form.getByRole('textbox', { name: 'Dirección' }).fill(address.address);
  await form.getByRole('textbox', { name: 'Código postal' }).fill(address.postalCode);
  await form.getByRole('textbox', { name: 'Localidad' }).fill(address.city);
  await form.getByRole('combobox', { name: 'Provincia' }).selectOption(address.province);
}

/** A shipping method radio. Its accessible name is "<label> <estimate> [· Gratis a partir de …] <price>". */
export function shippingOption(page: Page, label: 'Estándar' | 'Urgente' | '24 horas'): Locator {
  return stepForm(page, 'Envío').getByRole('radio', { name: new RegExp(`^${label}\\b`) });
}

export async function continueToReview(page: Page): Promise<Locator> {
  await stepForm(page, 'Envío').getByRole('button', { name: 'Revisar el pedido' }).click();
  const form = stepForm(page, 'Revisión');
  await expect(form).toBeVisible();
  return form;
}

/** Contact + shipping with valid data; ends on the review step. */
export async function completeCheckoutSteps(page: Page, method: 'Estándar' | 'Urgente' | '24 horas' = 'Estándar') {
  await fillContact(page);
  await continueToShipping(page);
  await fillAddress(page);
  await shippingOption(page, method).check();
  return continueToReview(page);
}

export function orderSummary(page: Page): Locator {
  return page.getByRole('complementary', { name: 'Resumen del pedido' });
}

/** Expands the order summary on small screens (it is always open from lg). */
export async function openOrderSummary(page: Page): Promise<Locator> {
  const summary = orderSummary(page);
  const toggle = summary.getByRole('button', { name: 'Mostrar resumen del pedido' });
  if (await toggle.isVisible()) await toggle.click();
  return summary;
}

/** Visible text of a totals row ("Total", "Subtotal", "Envío (Urgente)") inside `scope`. */
export function totalsValue(scope: Locator, term: string | RegExp): Locator {
  return definition(scope, term);
}
