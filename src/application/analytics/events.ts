import type { CampaignParameters } from '@/application/analytics/attribution';

/**
 * Catalogue of product-analytics events. Every tracked event is one of these,
 * so names and properties stay consistent across the app and in PostHog.
 * Monetary values are major units (e.g. euros) with an explicit currency.
 *
 * Browser events go through `AnalyticsService`. The order events marked "server" are sent by the Shopify
 * webhook route (`ServerAnalyticsEvent`), and the hosted-checkout steps by the Shopify custom pixel
 * (`shopify/custom-pixel.js`), which cannot import this file and mirrors its names. See docs/ANALYTICS.md.
 */

interface ProductProperties {
  product_id: string;
  product_slug: string;
  product_name: string;
  /** Selected variant (e.g. "2 personas"); null for single-variant products. */
  variant_title: string | null;
  category: string;
  price: number;
  currency: string;
}

export type CheckoutStepName = 'contact' | 'address' | 'shipping' | 'payment' | 'review';

export interface OrderLineProperties {
  /** The variant id (a Shopify variant GID with the Shopify provider). */
  product_id: string;
  /** The product's name, without the variant ("Kit 72h"). */
  product_name: string;
  /** Null for single-variant products. */
  variant_title: string | null;
  quantity: number;
  /** Unit price, major units. */
  price: number;
}

/**
 * A placed order. The local demo checkout sends it from the browser; with Shopify the webhook route sends it
 * server-side for `orders/paid`, adding the discount, the order's campaign parameters (from the cart attributes
 * written at checkout) and `test_order`. `revenue` is the order total: products, shipping and tax.
 */
export interface OrderCompletedProperties extends CampaignParameters {
  order_id: string;
  revenue: number;
  shipping: number;
  tax: number;
  currency: string;
  item_count: number;
  shipping_method: string;
  products: OrderLineProperties[];
  checkout_type: 'local' | 'hosted';
  discount?: number;
  discount_codes?: string[];
  /** A Shopify test order (bogus gateway or test mode); dashboards exclude them. */
  test_order?: boolean;
}

interface CartProperties {
  cart_value: number;
  cart_item_count: number;
  currency: string;
}

export type AnalyticsEvent =
  | { name: 'product_viewed'; properties: ProductProperties & { badge: string | null; in_stock: boolean } }
  /** The visitor picked another variant on the product page (never sent for the initial selection). */
  | { name: 'product_variant_selected'; properties: ProductProperties & { in_stock: boolean } }
  | {
      name: 'product_added_to_cart';
      properties: ProductProperties & CartProperties & {
        quantity: number;
        source: 'product_page' | 'product_card' | 'cart_drawer' | 'kit_builder';
      };
    }
  | { name: 'product_removed_from_cart'; properties: ProductProperties & CartProperties & { quantity: number } }
  | {
      name: 'add_to_cart_failed';
      properties: {
        product_id: string;
        variant_title: string | null;
        quantity: number;
        reason: 'out_of_stock' | 'max_quantity' | 'not_found' | 'unknown';
      };
    }
  | {
      /** The kit builder (Kit Custom page) put the visitor's selection in the cart; each line is also a product_added_to_cart. */
      name: 'kit_builder_added_to_cart';
      properties: CartProperties & {
        kit_slug: string;
        /** Lines and units the cart really took (lines that failed are left out). */
        line_count: number;
        unit_count: number;
        /** The chosen base backpack, or null for "Ya tengo mochila". */
        base_slug: string | null;
        /** The kit the selection started from ("Partir del Kit 72h"), or null. */
        preset_slug: string | null;
      };
    }
  | { name: 'cart_viewed'; properties: CartProperties }
  /**
   * The cart backend changed the cart on its own (Shopify lowered a quantity to the stock or dropped a sold-out
   * line), on load or after a change. Lost-sales signal; `quantity_requested` is null for a dropped line.
   */
  | {
      name: 'cart_adjusted';
      properties: {
        product_id: string;
        product_name: string;
        reason: 'quantity_reduced' | 'removed';
        quantity_requested: number | null;
        quantity_kept: number;
      };
    }
  | { name: 'checkout_started'; properties: CartProperties & { checkout_type: 'local' | 'hosted' } }
  /** The checkout could not be started (the backend failed); the visitor saw an error. */
  | { name: 'checkout_failed'; properties: CartProperties }
  /**
   * A checkout step was completed. The local demo checkout sends `contact`, `shipping`, `review`; the Shopify
   * custom pixel sends `contact`, `address`, `shipping`, `payment` for the hosted checkout.
   */
  | {
      name: 'checkout_step_completed';
      properties: CartProperties & { step: number; step_name: CheckoutStepName; checkout_type?: 'local' | 'hosted' };
    }
  | { name: 'order_completed'; properties: OrderCompletedProperties }
  | {
      name: 'products_filtered';
      properties: {
        category: string | null;
        price_min: number | null;
        price_max: number | null;
        in_stock_only: boolean;
        on_sale_only: boolean;
        sort_by: string;
        result_count: number;
      };
    }
  | { name: 'newsletter_subscribed'; properties: { location: 'home' | 'footer' } }
  | { name: 'contact_message_sent'; properties: { topic: string } };

/** Events sent server-side (Shopify webhooks), never from the browser. */
export type ServerAnalyticsEvent =
  | { name: 'order_completed'; properties: OrderCompletedProperties }
  | {
      name: 'order_refunded';
      properties: { order_id: string; refund_amount: number; currency: string; item_count: number; test_order: boolean };
    }
  | {
      name: 'order_cancelled';
      properties: { order_id: string; reason: string; revenue: number; currency: string; test_order: boolean };
    };
