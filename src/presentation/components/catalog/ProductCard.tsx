import Link from "next/link";
import type { Product } from "@/domain/entities/product/Product";
import { PriceTag, ProductBadge, RatingStars, cn } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { ProductImage } from "./ProductImage";

export const PRODUCT_CARD_IMAGE_SIZES = "(min-width: 1280px) 400px, (min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw";

export interface ProductCardProps {
  product: Product;
  /** 2 inside listing pages whose <h1> is the page title; 3 under a section <h2>. */
  headingLevel?: 2 | 3;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/** Product summary whose whole surface is a single link to the product page. */
export function ProductCard({
  product,
  headingLevel = 2,
  sizes = PRODUCT_CARD_IMAGE_SIZES,
  priority = false,
  className,
}: ProductCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-sand bg-white shadow-sm",
        "transition motion-safe:hover:-translate-y-0.5 hover:shadow-md",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent has-[a:focus-visible]:ring-offset-2",
        className,
      )}
    >
      <div className="relative aspect-square bg-sand/20">
        <ProductImage product={product} sizes={sizes} priority={priority} className="p-4" />
        {product.badge && <ProductBadge badge={product.badge} className="absolute left-3 top-3" />}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-deep/60">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-ink">
              {messages.catalog.card.outOfStock}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Heading className="text-lg font-semibold leading-snug text-ink">
          <Link
            href={routes.product(product.slug)}
            className="break-words after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-hover:text-accent"
          >
            {product.name}
          </Link>
        </Heading>
        <p className="line-clamp-2 text-sm text-muted">{product.description}</p>
        <RatingStars rating={product.rating} size="sm" showCount />
        <PriceTag price={product.price} originalPrice={product.originalPrice} className="mt-auto pt-2" />
      </div>
    </article>
  );
}
