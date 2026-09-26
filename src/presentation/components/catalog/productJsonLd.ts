import type { Product } from "@/domain/entities/product/Product";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const absolute = (path: string, origin: string) => new URL(path, origin).toString();

/** schema.org Product data for a product page. */
export function productJsonLd(product: Product, origin: string): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.details?.longDescription ?? product.description,
    image: product.images.map((image) => absolute(image.url, origin)),
    sku: product.id.value,
    brand: { "@type": "Brand", name: messages.catalog.product.brand },
    offers: {
      "@type": "Offer",
      price: product.price.amount.toFixed(2),
      priceCurrency: product.price.currency,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absolute(routes.product(product.slug), origin),
    },
  };
  if (product.hasReviews() && product.rating) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating.average,
      reviewCount: product.rating.count,
    };
  }
  return data;
}

/** JSON for a <script type="application/ld+json">, with "<" escaped so it cannot close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
