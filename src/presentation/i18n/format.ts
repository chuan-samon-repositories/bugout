import { Money } from '@/domain/value-objects/Money';
import { LOCALE } from './config';

const currencyFormatters = new Map<string, Intl.NumberFormat>();

/** Formats Money for display, e.g. "199,00 €". */
export function formatMoney(money: Money): string {
  let formatter = currencyFormatters.get(money.currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: money.currency });
    currencyFormatters.set(money.currency, formatter);
  }
  return formatter.format(money.amount);
}

const numberFormatter = new Intl.NumberFormat(LOCALE);

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

const ratingFormatter = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Formats a 0–5 rating with one decimal, e.g. "4,9". */
export function formatRating(value: number): string {
  return ratingFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long' });

export function formatDate(value: Date | string): string {
  return dateFormatter.format(typeof value === 'string' ? new Date(value) : value);
}
