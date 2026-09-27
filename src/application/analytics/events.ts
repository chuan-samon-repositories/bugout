/**
 * Catalogue of product-analytics events. Every tracked event is one of these,
 * so names and properties stay consistent across the app and in PostHog.
 * Monetary values are major units (e.g. euros) with an explicit currency.
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
      properties: ProductProperties & CartProperties & { quantity: number; source: 'product_page' | 'product_card' | 'cart_drawer' };
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
  | { name: 'cart_viewed'; properties: CartProperties }
  | { name: 'checkout_started'; properties: CartProperties & { checkout_type: 'local' | 'hosted' } }
  | {
      name: 'checkout_step_completed';
      properties: CartProperties & { step: number; step_name: 'contact' | 'shipping' | 'review' };
    }
  | {
      name: 'order_completed';
      properties: {
        order_id: string;
        revenue: number;
        shipping: number;
        tax: number;
        currency: string;
        item_count: number;
        shipping_method: string;
        /** `product_id` is the variant id; `variant_title` is null for single-variant products. */
        products: Array<{ product_id: string; variant_title: string | null; quantity: number; price: number }>;
      };
    }
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
