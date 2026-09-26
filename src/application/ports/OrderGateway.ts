import { OrderConfirmation, OrderRequest } from '@/application/dtos/Order';

/**
 * Places an order with the in-app checkout. Only used by the local provider;
 * with Shopify the hosted checkout owns order placement.
 */
export interface OrderGateway {
  placeOrder(request: OrderRequest): Promise<OrderConfirmation>;
}
