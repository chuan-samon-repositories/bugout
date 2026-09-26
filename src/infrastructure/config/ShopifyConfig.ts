export interface ShopifyConfig {
  /** e.g. "mystore.myshopify.com" */
  storeDomain: string;
  /** Public Storefront API access token (safe to expose to the browser). */
  storefrontAccessToken: string;
  /** Storefront API version; defaults to DEFAULT_SHOPIFY_API_VERSION. */
  apiVersion?: string;
}
