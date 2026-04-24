export interface ShopifyConfig {
  storeDomain: string;            // e.g. "mystore.myshopify.com"
  storefrontAccessToken: string;  // Public Storefront API token
  apiVersion?: string;            // defaults to "2024-01"
}
