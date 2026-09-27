import { CheckoutAttribution, EMPTY_ATTRIBUTION } from '@/application/analytics/attribution';

export type CommerceProvider = 'local' | 'shopify';

export interface CheckoutSession {
  url: string;
  /** 'local' for the in-app checkout route, 'hosted' for an absolute external URL (Shopify). */
  type: 'local' | 'hosted';
}

/** What the checkout needs to know about the visitor's privacy choices and analytics. */
export interface CheckoutContext {
  /** Analytics consent: true or false once the visitor decided, null while undecided. */
  analyticsConsent: boolean | null;
  attribution: CheckoutAttribution;
}

export const DEFAULT_CHECKOUT_CONTEXT: CheckoutContext = Object.freeze({
  analyticsConsent: null,
  attribution: EMPTY_ATTRIBUTION,
});
