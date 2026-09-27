import type { Metadata } from "next";
import { comparableKits, includedInIndex, kitsIn, resolveContents } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { getContainer } from "@/infrastructure/config";
import { FeaturedProducts } from "@/presentation/components/home/FeaturedProducts";
import { heroKits, pickFeatured, pickFlagship } from "@/presentation/components/home/homeData";
import { HomeHero } from "@/presentation/components/home/HomeHero";
import { HomeComparison, HomeInside, HomeKits } from "@/presentation/components/home/HomeKits";
import { NewsletterSection } from "@/presentation/components/home/NewsletterSection";
import { TrustBar } from "@/presentation/components/home/TrustBar";
import { WhyPrepareTeaser } from "@/presentation/components/home/WhyPrepareTeaser";
import { navData } from "@/presentation/components/layout/navigation";
import { isMessagingEnabled } from "@/presentation/config/messaging";
import { siteConfig } from "@/presentation/config/site";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { JsonLd } from "@/presentation/seo/JsonLd";
import { pageMetadata } from "@/presentation/seo/pageMetadata";
import { organizationJsonLd, websiteJsonLd } from "@/presentation/seo/structuredData";

/** Regenerate at most every 5 minutes so catalog price and stock changes show up without a redeploy. */
export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: messages.shell.metadata.defaultTitle,
  description: messages.shell.metadata.defaultDescription,
  path: routes.home,
  absoluteTitle: true,
});

const KITS_SECTION_ID = "kits";

async function loadProducts(): Promise<Product[]> {
  try {
    return await getContainer().getGetProductsUseCase().execute();
  } catch (error) {
    console.error("Could not load products for the home page", error);
    return [];
  }
}

/** Sections in the partner design's order: hero, kits, 24h vs 72h, what's inside, why prepare, loose products, trust. */
export default async function HomePage() {
  const products = await loadProducts();
  const kits = kitsIn(products);
  const compared = comparableKits(products).slice(0, 2);
  const flagship = pickFlagship(kits);
  const featured = pickFeatured(products);

  return (
    <>
      <JsonLd data={[organizationJsonLd(siteConfig.url), websiteJsonLd(siteConfig.url)]} />
      <HomeHero kits={heroKits(navData(products))} scrollTargetId={KITS_SECTION_ID} />
      {kits.length > 0 && <HomeKits id={KITS_SECTION_ID} kits={kits} />}
      {compared.length > 1 && <HomeComparison kits={compared} />}
      {flagship && <HomeInside kit={flagship} lines={resolveContents(flagship, products)} />}
      <WhyPrepareTeaser />
      {featured.length > 0 && <FeaturedProducts products={featured} includedIn={includedInIndex(products)} />}
      {isMessagingEnabled() && <NewsletterSection />}
      <TrustBar policy={getContainer().getPricingPolicy()} />
    </>
  );
}
