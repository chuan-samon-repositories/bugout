import Link from "next/link";
import type { Product } from "@/domain/entities/product/Product";
import { PriceTag, ProductBadge, RatingStars, cn } from "@/presentation/components/ui";
import { formatMoney, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { ProductImage } from "./ProductImage";
import { toProductSnapshot } from "./productSnapshot";
import { QuickAddButton } from "./QuickAddButton";

export const PRODUCT_CARD_IMAGE_SIZES = "(min-width: 1280px) 280px, (min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw";

export interface ProductCardProps {
  product: Product;
  /** Names of the kits that include this product ("Incluido en el Kit 24h"). */
  includedIn?: readonly string[];
  /** 2 inside listing pages whose <h1> is the page title; 3 under a section <h2>. */
  headingLevel?: 2 | 3;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * The partner design's shop card: photo on navy, name, "Incluido en" badges, price and
 * a quick "Añadir" button. The name is the card's link and stretches over the whole
 * surface; the button sits above it. Products with variants (kits) have no quick add:
 * the visitor picks the variant on the product page.
 */
export function ProductCard({
  product,
  includedIn = [],
  headingLevel = 2,
  sizes = PRODUCT_CARD_IMAGE_SIZES,
  priority = false,
  className,
}: ProductCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const quickAdd = product.inStock && !product.hasVariants();
  const { min } = product.priceRange();

  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col rounded-2xl bg-white p-3.5 pb-4 shadow-card",
        "transition-[transform,box-shadow] duration-350 ease-brand motion-safe:hover:-translate-y-1.5 hover:shadow-lift",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent has-[a:focus-visible]:ring-offset-2",
        className,
      )}
    >
      <div className="relative mb-3.5 aspect-square overflow-hidden rounded-lg bg-navy">
        {product.details?.kit && product.images.length === 0 ? (
          <div
            role="img"
            aria-label={product.name}
            className="absolute inset-0 flex items-center justify-center bg-linear-135 from-navy to-navy-darker after:absolute after:inset-0 after:bg-[repeating-linear-gradient(115deg,rgb(255_255_255/0.05)_0_2px,transparent_2px_40px)]"
          >
            <span className="relative z-10 rounded-full bg-orange px-4 py-2 text-sm font-extrabold tracking-[0.08em] text-navy-deep">
              {product.details.kit.label}
            </span>
          </div>
        ) : (
          <ProductImage product={product} sizes={sizes} priority={priority} />
        )}
        {product.badge && <ProductBadge badge={product.badge} className="absolute top-2.5 left-2.5" />}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-deep/60">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-navy-deep">
              {messages.catalog.card.outOfStock}
            </span>
          </div>
        )}
      </div>
      <Heading className="mb-3 text-sm leading-snug font-bold tracking-normal text-navy-deep">
        <Link
          href={routes.product(product.slug)}
          className="break-words after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none group-hover:text-accent"
        >
          {product.name}
        </Link>
      </Heading>
      {includedIn.length > 0 && (
        <ul aria-label={messages.catalog.kit.includedInLabel} className="mb-3.5 flex flex-wrap gap-1.5">
          {includedIn.map((kit) => (
            <li key={kit} className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.6875rem] font-bold text-navy-deep">
              {messages.catalog.kit.includedIn(kit)}
            </li>
          ))}
        </ul>
      )}
      <RatingStars rating={product.rating} size="sm" showCount className="mb-2" />
      <div className="mt-auto flex items-center justify-between gap-2">
        {product.hasPriceRange() ? (
          <span className="text-base font-extrabold text-navy-deep">{messages.catalog.kit.fromPrice(formatMoney(min))}</span>
        ) : (
          <PriceTag price={product.price} originalPrice={product.originalPrice} size="sm" />
        )}
        {quickAdd && <QuickAddButton product={toProductSnapshot(product)} className="relative z-10 shrink-0" />}
      </div>
    </article>
  );
}
