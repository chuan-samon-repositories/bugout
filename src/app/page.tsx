import type { Product } from "@/domain/entities/product/Product";
import { getContainer } from "@/infrastructure/config";
import { FeaturedProducts } from "@/presentation/components/home/FeaturedProducts";
import { FLAGSHIP_SLUG, pickFeatured, summarizeReviews } from "@/presentation/components/home/homeData";
import { HomeHero } from "@/presentation/components/home/HomeHero";
import { KitShowcase } from "@/presentation/components/home/KitShowcase";
import { NewsletterSection } from "@/presentation/components/home/NewsletterSection";
import { Principles } from "@/presentation/components/home/Principles";
import { ValueProps } from "@/presentation/components/home/ValueProps";

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
  const flagship = products.find((product) => product.slug === FLAGSHIP_SLUG) ?? null;
  const featured = pickFeatured(products);

  return (
    <>
      <HomeHero flagshipSlug={flagship?.slug ?? null} reviews={summarizeReviews(products)} />
      <ValueProps policy={getContainer().getPricingPolicy()} />
      {featured.length > 0 && <FeaturedProducts products={featured} />}
      {flagship && (flagship.details?.contents.length ?? 0) > 0 && <KitShowcase product={flagship} />}
      <NewsletterSection />
      <Principles />
    </>
  );
}
