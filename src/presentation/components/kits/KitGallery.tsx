import Image from "next/image";
import type { ResolvedContentLine } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { ProductGallery } from "@/presentation/components/catalog/ProductGallery";
import { toProductSnapshot } from "@/presentation/components/catalog/productSnapshot";
import { messages } from "@/presentation/i18n";

const copy = messages.catalog.kit;

/**
 * Kit pictures: the kit's own photos when the backend has them (otherwise a decorative
 * navy box with the kit label, as on the cards, never a stand-in photo), then a grid with
 * the photo of every content line sold separately.
 */
export function KitGallery({
  kit,
  lines,
  label = copy.galleryContents,
}: {
  kit: Product;
  lines: readonly ResolvedContentLine[];
  /** Accessible name of the content photo grid. */
  label?: string;
}) {
  const pictured = lines.flatMap((line) => (line.product?.images[0] ? [{ product: line.product, image: line.product.images[0] }] : []));
  const unique = pictured.filter((entry, index) => pictured.findIndex((other) => other.product.slug === entry.product.slug) === index);

  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      {kit.images.length > 0 ? (
        <ProductGallery product={toProductSnapshot(kit)} />
      ) : (
        // Decorative: the page's <h1> already names the kit, and the content photos follow.
        <div
          aria-hidden="true"
          data-kit-placeholder=""
          className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-linear-135 from-navy to-navy-darker after:absolute after:inset-0 after:bg-[repeating-linear-gradient(115deg,rgb(255_255_255/0.05)_0_2px,transparent_2px_40px)]"
        >
          {kit.details?.kit && (
            <span className="relative z-10 rounded-full bg-orange px-5 py-2.5 text-base font-extrabold tracking-[0.08em] text-navy-deep">
              {kit.details.kit.label}
            </span>
          )}
        </div>
      )}
      {unique.length > 0 && (
        <ul aria-label={label} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {unique.map(({ product, image }) => (
            <li key={product.slug} className="relative aspect-square overflow-hidden rounded-lg bg-navy">
              <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 140px, 25vw" className="object-cover" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
