import type { AnalyticsEvent } from "@/application/analytics/events";
import type { Product } from "@/domain/entities/product/Product";

export type ProductViewedProperties = Extract<AnalyticsEvent, { name: "product_viewed" }>["properties"];
export type ProductVariantSelectedProperties = Extract<AnalyticsEvent, { name: "product_variant_selected" }>["properties"];

/** The selected variant of `product`: its id is the variant id, its price is in major units. */
function variantProperties(product: Product) {
  return {
    product_id: product.id.value,
    product_slug: product.slug,
    product_name: product.name,
    variant_title: product.variantTitle,
    category: product.category,
    price: product.price.amount,
    currency: product.price.currency,
  };
}

export function productViewedProperties(product: Product): ProductViewedProperties {
  return { ...variantProperties(product), badge: product.badge, in_stock: product.inStock };
}

/** `product` with the newly picked variant selected. */
export function variantSelectedProperties(product: Product): ProductVariantSelectedProperties {
  return { ...variantProperties(product), in_stock: product.inStock };
}
