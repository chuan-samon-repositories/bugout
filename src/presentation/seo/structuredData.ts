import { SHIPPABLE_PROVINCES, SHIPPING_COUNTRY } from "@/application/checkout";
import { shippingCost, type PricingPolicy } from "@/domain/entities/order/OrderPricing";
import type { Money } from "@/domain/value-objects/Money";
import type { BreadcrumbItem } from "@/presentation/components/ui";
import { brandAssets } from "@/presentation/config/brand";
import { siteConfig } from "@/presentation/config/site";
import { LOCALE } from "@/presentation/i18n";
import { LEGAL_WITHDRAWAL_DAYS } from "@/presentation/i18n/messages/content";

/**
 * schema.org data (JSON-LD) for search engines. Every fact comes from the catalog, the pricing policy or
 * siteConfig, like the visible copy. Builders take the site origin because siteConfig.url is server-only.
 */
export type JsonLdObject = Record<string, unknown>;

const SCHEMA = "https://schema.org";

export const absoluteUrl = (path: string, origin: string) => new URL(path, origin).toString();

const organizationId = (origin: string) => `${absoluteUrl("/", origin)}#organization`;
const websiteId = (origin: string) => `${absoluteUrl("/", origin)}#website`;

/** Days to return an order: the store's window, never less than the legal withdrawal period. */
export const returnWindowDays = () => Math.max(siteConfig.returnWindowDays, LEGAL_WITHDRAWAL_DAYS);

/**
 * The returns policy of the shipping and returns page: a finite window, by mail, and the customer pays the
 * return shipping (except for defective items, which schema.org cannot express per product).
 */
export function merchantReturnPolicy(): JsonLdObject {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: SHIPPING_COUNTRY,
    returnPolicyCountry: SHIPPING_COUNTRY,
    returnPolicyCategory: `${SCHEMA}/MerchantReturnFiniteReturnWindow`,
    merchantReturnDays: returnWindowDays(),
    returnMethod: `${SCHEMA}/ReturnByMail`,
    returnFees: `${SCHEMA}/ReturnFeesCustomerResponsibility`,
  };
}

/**
 * One OfferShippingDetails per shipping method, priced for an order of `price` alone (so free standard
 * shipping shows from the threshold). The destination lists the prefixes of the provinces the store ships to,
 * which leaves out Canarias, Ceuta and Melilla. Delivery times are not given: the policy has one delivery
 * estimate per method, not the separate handling and transit times schema.org asks for.
 */
export function shippingDetails(policy: PricingPolicy, price: Money): JsonLdObject[] {
  const destination = {
    "@type": "DefinedRegion",
    addressCountry: SHIPPING_COUNTRY,
    postalCodePrefix: SHIPPABLE_PROVINCES.map((province) => province.postalPrefix).sort(),
  };
  return policy.shippingRates.map((rate) => {
    const cost = shippingCost(rate, price);
    return {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: cost.amount.toFixed(2), currency: cost.currency },
      shippingDestination: destination,
    };
  });
}

/** The shop itself. The legal identity and email appear only when configured, as on the legal pages. */
export function organizationJsonLd(origin: string): JsonLdObject {
  const { legal, contactEmail } = siteConfig;
  return {
    "@context": SCHEMA,
    "@type": "OnlineStore",
    "@id": organizationId(origin),
    name: siteConfig.name,
    url: absoluteUrl("/", origin),
    logo: absoluteUrl(brandAssets.wordmarkStacked("navy").src, origin),
    ...(legal.name ? { legalName: legal.name } : {}),
    ...(legal.taxId ? { taxID: legal.taxId } : {}),
    ...(legal.address ? { address: legal.address } : {}),
    ...(contactEmail ? { email: contactEmail } : {}),
    areaServed: SHIPPING_COUNTRY,
    hasMerchantReturnPolicy: merchantReturnPolicy(),
  };
}

export function websiteJsonLd(origin: string): JsonLdObject {
  return {
    "@context": SCHEMA,
    "@type": "WebSite",
    "@id": websiteId(origin),
    name: siteConfig.name,
    url: absoluteUrl("/", origin),
    inLanguage: LOCALE,
    publisher: { "@id": organizationId(origin) },
  };
}

/** The shop as publisher or author of a page: a reference to the organization, with its name and URL. */
const organizationRef = (origin: string): JsonLdObject => ({
  "@type": "Organization",
  "@id": organizationId(origin),
  name: siteConfig.name,
  url: absoluteUrl("/", origin),
});

export interface ArticleCitation {
  name: string;
  url: string;
  /** The organisation that publishes the cited page. */
  publisher: string;
}

export interface ArticleJsonLdInput {
  headline: string;
  description: string;
  path: string;
  /** ISO dates the content was first published and last checked. */
  datePublished: string;
  dateModified: string;
  image?: string;
  /** The official pages the article is based on, as shown on the page. */
  citations: readonly ArticleCitation[];
}

/**
 * A guide page written by the shop (an action card): headline, the date its content was last checked, the
 * shop as author and publisher, and the official pages it cites, like the visible "Fuentes". It claims no
 * medical review and no rich result (Google shows none for how-to guides).
 */
export function articleJsonLd(input: ArticleJsonLdInput, origin: string): JsonLdObject {
  const url = absoluteUrl(input.path, origin);
  return {
    "@context": SCHEMA,
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: url,
    inLanguage: LOCALE,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    ...(input.image ? { image: absoluteUrl(input.image, origin) } : {}),
    author: organizationRef(origin),
    publisher: organizationRef(origin),
    isPartOf: { "@id": websiteId(origin) },
    citation: input.citations.map((citation) => ({
      "@type": "CreativeWork",
      name: citation.name,
      url: citation.url,
      publisher: { "@type": "Organization", name: citation.publisher },
    })),
  };
}

/** A page that lists other pages (the Prepárate index): its name and the pages, in the order shown. */
export function collectionPageJsonLd(
  input: { name: string; description: string; path: string; items: readonly { name: string; path: string }[] },
  origin: string,
): JsonLdObject {
  return {
    "@context": SCHEMA,
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path, origin),
    inLanguage: LOCALE,
    isPartOf: { "@id": websiteId(origin) },
    publisher: organizationRef(origin),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path, origin),
      })),
    },
  };
}

/** The visible breadcrumbs as a BreadcrumbList; the last item (the current page, without href) is `currentPath`. */
export function breadcrumbJsonLd(items: readonly BreadcrumbItem[], currentPath: string, origin: string): JsonLdObject {
  return {
    "@context": SCHEMA,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href ?? currentPath, origin),
    })),
  };
}

export interface FaqEntry {
  question: string;
  /** Plain text of the visible answer. */
  answer: string;
}

export function faqPageJsonLd(entries: readonly FaqEntry[]): JsonLdObject {
  return {
    "@context": SCHEMA,
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/** JSON for a <script type="application/ld+json">, with "<" escaped so it cannot close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
