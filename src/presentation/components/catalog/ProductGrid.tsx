import type { Product } from "@/domain/entities/product/Product";
import { cn } from "@/presentation/components/ui";
import { ProductCard, type ProductCardProps } from "./ProductCard";

export interface ProductGridProps {
  products: readonly Product[];
  /** Kit names per product slug, for the "Incluido en" badges. */
  includedIn?: Readonly<Record<string, readonly string[]>>;
  headingLevel?: ProductCardProps["headingLevel"];
  sizes?: string;
  className?: string;
}

/** Responsive grid of product cards (partner "shop-grid": about 4 columns on desktop). */
export function ProductGrid({ products, includedIn, headingLevel, sizes, className }: ProductGridProps) {
  return (
    <ul className={cn("grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((product) => (
        <li key={product.slug} className="min-w-0">
          <ProductCard
            product={product}
            includedIn={includedIn?.[product.slug]}
            headingLevel={headingLevel}
            sizes={sizes}
          />
        </li>
      ))}
    </ul>
  );
}
