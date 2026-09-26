export type CommerceProvider = 'local' | 'shopify';

export interface CheckoutSession {
  url: string;
  /** 'local' for the in-app checkout route, 'hosted' for an absolute external URL (Shopify). */
  type: 'local' | 'hosted';
}
