import type { AnalyticsEvent } from "@/application/analytics/events";
import type { Product } from "@/domain/entities/product/Product";

export type ProductViewedProperties = Extract<AnalyticsEvent, { name: "product_viewed" }>["properties"];

export function productViewedProperties(product: Product): ProductViewedProperties {
  return {
    product_id: product.id.value,
    product_slug: product.slug,
    product_name: product.name,
    category: product.category,
    price: product.price.amount,
    currency: product.price.currency,
    badge: product.badge,
    in_stock: product.inStock,
  };
}
