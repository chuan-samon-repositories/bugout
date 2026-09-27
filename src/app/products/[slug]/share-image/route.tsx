import { NotFoundError } from "@/domain/errors";
import { getContainer } from "@/infrastructure/config";
import { startingPriceLabel } from "@/presentation/components/catalog/startingPrice";
import { renderShareImage } from "@/presentation/seo/shareImage";

/** Regenerated at most every 5 minutes, like the product page (the image shows the starting price). */
export const revalidate = 300;

/** Prerenders the images the product pages point to: those of products without photos. */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const products = await getContainer().getGetProductsUseCase().execute();
    return products.filter((product) => product.images.length === 0).map((product) => ({ slug: product.slug }));
  } catch (error) {
    console.error("Could not prerender the product share images", error);
    return [];
  }
}

/**
 * Share image (Open Graph) of a product without photos: the kit label, the search title, the short description
 * and the price. The product page points to it only while the product has no images.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const product = await getContainer().getGetProductBySlugUseCase().execute(slug);
    return await renderShareImage({
      badge: product.details?.kit?.label,
      title: product.seo?.title ?? product.name,
      subtitle: product.description,
      highlight: startingPriceLabel(product),
    });
  } catch (error) {
    if (error instanceof NotFoundError) return new Response(null, { status: 404 });
    throw error;
  }
}
