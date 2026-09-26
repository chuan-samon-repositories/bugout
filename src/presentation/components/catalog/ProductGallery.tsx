"use client";

import { useMemo, useState } from "react";
import { cn, focusRing } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { ProductImage } from "./ProductImage";
import { fromProductSnapshot, type ProductSnapshot } from "./productSnapshot";

export interface ProductGalleryProps {
  product: ProductSnapshot;
}

/** Main product image with thumbnail buttons; use only when the product has more than one image. */
export function ProductGallery({ product: snapshot }: ProductGalleryProps) {
  const product = useMemo(() => fromProductSnapshot(snapshot), [snapshot]);
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-sand/20">
        <ProductImage
          product={product}
          index={selected}
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority={selected === 0}
          className="p-6"
        />
      </div>
      <ul aria-label={messages.catalog.product.gallery} className="flex flex-wrap gap-3">
        {product.images.map((image, index) => (
          <li key={`${image.url}-${index}`}>
            <button
              type="button"
              aria-label={messages.catalog.product.showImage(index + 1)}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={cn(
                "relative block size-20 overflow-hidden rounded-lg border-2 bg-sand/20",
                selected === index ? "border-accent" : "border-transparent hover:border-navy",
                focusRing,
              )}
            >
              <ProductImage product={product} index={index} sizes="80px" className="p-1" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
