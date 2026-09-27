import Image from "next/image";
import type { ResolvedContentLine } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { ProductGallery } from "@/presentation/components/catalog/ProductGallery";
import { toProductSnapshot } from "@/presentation/components/catalog/productSnapshot";
import { messages } from "@/presentation/i18n";

const copy = messages.catalog.kit;

/**
 * Kit pictures: the kit's own photos when the backend has them (a striped "coming soon"
 * box otherwise, never a stand-in photo), then a grid with the photo of every content
 * line sold separately.
 */
export function KitGallery({ kit, lines }: { kit: Product; lines: readonly ResolvedContentLine[] }) {
  const pictured = lines.flatMap((line) => (line.product?.images[0] ? [{ product: line.product, image: line.product.images[0] }] : []));
  const unique = pictured.filter((entry, index) => pictured.findIndex((other) => other.product.slug === entry.product.slug) === index);

  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      {kit.images.length > 0 ? (
        <ProductGallery product={toProductSnapshot(kit)} />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-[repeating-linear-gradient(135deg,var(--color-sand-line)_0_10px,var(--color-sand-dim)_10px_20px)] p-5 text-center text-sm font-bold text-navy-deep">
          {copy.galleryClosed}
        </div>
      )}
      {unique.length > 0 && (
        <ul aria-label={copy.galleryContents} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
