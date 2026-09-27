import type { Product } from "@/domain/entities/product/Product";
import { formatMoney, messages } from "@/presentation/i18n";

/**
 * True when a product's price is only a starting point: its variants have different
 * prices, or it is a build-your-own kit base that the visitor completes with loose products.
 */
export function hasStartingPrice(product: Product): boolean {
  return product.hasPriceRange() || !!product.details?.kit?.buildYourOwn;
}

/** "Desde 39,00 €" for a starting price (see `hasStartingPrice`); otherwise the lowest price. */
export function startingPriceLabel(product: Product): string {
  const { min } = product.priceRange();
  return hasStartingPrice(product) ? messages.catalog.kit.fromPrice(formatMoney(min)) : formatMoney(min);
}
