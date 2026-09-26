import Image from "next/image";
import type { Product } from "@/domain/entities/product/Product";
import { cn } from "@/presentation/components/ui/cn";
import { PackageIcon } from "@/presentation/components/ui";

interface ProductImageProps {
  product: Product;
  /** Which of the product's images to show (defaults to the first). */
  index?: number;
  /** Responsive `sizes` hint for next/image, e.g. "(min-width: 1024px) 33vw, 100vw". */
  sizes: string;
  priority?: boolean;
  className?: string;
}

/**
 * Square product picture that fills its (relative) parent. Products without
 * photos get a neutral placeholder rather than an unrelated stock image.
 */
export function ProductImage({ product, index = 0, sizes, priority = false, className }: ProductImageProps) {
  const image = product.images[index];

  if (!image) {
    return (
      <div
        role="img"
        aria-label={product.name}
        className={cn("absolute inset-0 flex items-center justify-center bg-sand/40 text-navy/40", className)}
      >
        <PackageIcon className="size-1/3" />
      </div>
    );
  }

  return (
    <Image
      src={image.url}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-contain", className)}
    />
  );
}
