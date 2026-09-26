import type { Product } from "@/domain/entities/product/Product";
import { getContainer } from "@/infrastructure/config";
import { FeaturedProducts } from "@/presentation/components/home/FeaturedProducts";
import { pickFeatured, pickFlagship, summarizeReviews } from "@/presentation/components/home/homeData";
import { HomeHero } from "@/presentation/components/home/HomeHero";
import { KitShowcase } from "@/presentation/components/home/KitShowcase";
import { NewsletterSection } from "@/presentation/components/home/NewsletterSection";
import { Principles } from "@/presentation/components/home/Principles";
import { ValueProps } from "@/presentation/components/home/ValueProps";

/** Regenerate at most every 5 minutes so catalog price and stock changes show up without a redeploy. */
export const revalidate = 300;

async function loadProducts(): Promise<Product[]> {
  try {
    return await getContainer().getGetProductsUseCase().execute();
  } catch (error) {
    console.error("Could not load products for the home page", error);
    return [];
  }
}

export default async function HomePage() {
  const products = await loadProducts();
  const flagship = pickFlagship(products);
  const featured = pickFeatured(products);

  return (
    <>
      <HomeHero flagshipSlug={flagship?.slug ?? null} reviews={summarizeReviews(products)} />
      <ValueProps policy={getContainer().getPricingPolicy()} />
      {featured.length > 0 && <FeaturedProducts products={featured} />}
      {flagship && <KitShowcase product={flagship} />}
      <NewsletterSection />
      <Principles />
    </>
  );
}
