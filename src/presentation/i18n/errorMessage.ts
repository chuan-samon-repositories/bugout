import { BusinessRuleError, NotFoundError } from '@/domain/errors';
import { MAX_QUANTITY_PER_ITEM } from '@/domain/entities/cart/Cart';
import { messages } from './messages';

/** Maps any thrown value to a Spanish, user-facing message. */
export function toUserMessage(error: unknown, context: { productName?: string } = {}): string {
  if (error instanceof BusinessRuleError) {
    switch (error.code) {
      case 'OUT_OF_STOCK':
        return messages.errors.outOfStock(context.productName ?? messages.errors.unnamedProduct);
      case 'MAX_QUANTITY_EXCEEDED':
        return messages.errors.maxQuantity(MAX_QUANTITY_PER_ITEM);
      case 'CURRENCY_MISMATCH':
        return messages.errors.cartUnavailable;
    }
  }
  if (error instanceof NotFoundError) {
    return messages.errors.productNotFound;
  }
  return messages.errors.generic;
}
