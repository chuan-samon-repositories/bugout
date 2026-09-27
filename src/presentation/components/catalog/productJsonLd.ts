import type { PricingPolicy } from "@/domain/entities/order/OrderPricing";
import type { Product, ProductVariant } from "@/domain/entities/product/Product";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import {
  absoluteUrl,
  merchantReturnPolicy,
  shippingDetails,
  type JsonLdObject,
} from "@/presentation/seo/structuredData";

/** Shopify ids are GIDs ("gid://shopify/ProductVariant/…"): internal handles, not a stock-keeping unit. */
const isShopifyGid = (id: string) => id.startsWith("gid://");

const availability = (inStock: boolean) => (inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock");

export interface ProductJsonLdContext {
  /** Site origin (siteConfig.url, server-side only). */
  origin: string;
  /** The store's pricing policy, for the shipping rates of each offer. */
  policy: PricingPolicy;
}

/** The Offer of one variant: price, stock, shipping rates and the returns policy. */
function offer(variant: ProductVariant, url: string, policy: PricingPolicy): JsonLdObject {
  return {
    "@type": "Offer",
    price: variant.price.amount.toFixed(2),
    priceCurrency: variant.price.currency,
    availability: availability(variant.inStock),
    itemCondition: "https://schema.org/NewCondition",
    url,
    shippingDetails: shippingDetails(policy, variant.price),
    hasMerchantReturnPolicy: merchantReturnPolicy(),
  };
}

const sku = (variant: ProductVariant) => (isShopifyGid(variant.id.value) ? {} : { sku: variant.id.value });

/**
 * schema.org data for a product page. A product sold in several variants (a kit for 1, 2 or 4 people) is a
 * ProductGroup whose variants differ by size (the number of people), each with its own Offer; any other
 * product is a Product with one Offer, except a build-your-own kit, which has none.
 */
export function productJsonLd(product: Product, { origin, policy }: ProductJsonLdContext): JsonLdObject {
  const url = absoluteUrl(routes.product(product.slug), origin);
  const images = product.images.map((image) => absoluteUrl(image.url, origin));
  const image = images.length > 0 ? { image: images } : {};
  const brand = { "@type": "Brand", name: messages.catalog.product.brand };
  const description = product.details?.longDescription ?? product.description;
  const rating =
    product.hasReviews() && product.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.average,
            reviewCount: product.rating.count,
          },
        }
      : {};

  if (!product.hasVariants()) {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description,
      url,
      brand,
      ...image,
      ...sku(product.selectedVariant()),
      ...rating,
      // A build-your-own kit is not sold as such (its page adds loose products), so it has no offer.
      ...(product.isBuildYourOwn() ? {} : { offers: offer(product.selectedVariant(), url, policy) }),
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: product.name,
    description,
    url,
    brand,
    ...image,
    productGroupID: product.slug,
    variesBy: "https://schema.org/size",
    ...rating,
    hasVariant: product.variants.map((variant) => ({
      "@type": "Product",
      name: `${product.name} · ${variant.title}`,
      description,
      size: variant.title,
      ...image,
      ...sku(variant),
      offers: offer(variant, url, policy),
    })),
  };
}
