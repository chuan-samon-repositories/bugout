import { OrderConfirmation, OrderRequest } from '@/application/dtos/Order';
import { OrderGateway } from '@/application/ports/OrderGateway';
import { delay } from '../delay';

const ORDER_NUMBER_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ORDER_NUMBER_LENGTH = 8;

/** e.g. "BUG-7K2Q9XA1". */
export function generateOrderNumber(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ORDER_NUMBER_LENGTH));
  return `BUG-${Array.from(bytes, (byte) => ORDER_NUMBER_ALPHABET[byte % ORDER_NUMBER_ALPHABET.length]).join('')}`;
}

/** Demo order placement for the local provider: no payment, nothing leaves the browser. */
export class LocalOrderGateway implements OrderGateway {
  constructor(private readonly options: { delayMs?: number } = {}) {}

  async placeOrder(request: OrderRequest): Promise<OrderConfirmation> {
    await delay(this.options.delayMs ?? 800);
    return {
      orderNumber: generateOrderNumber(),
      placedAt: new Date().toISOString(),
      email: request.details.customer.email,
      lines: request.lines.map((line) => ({ ...line })),
      totals: request.totals,
      shippingMethod: request.details.shippingMethod,
    };
  }
}
