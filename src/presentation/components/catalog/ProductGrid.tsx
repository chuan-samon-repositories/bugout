import type { Product } from "@/domain/entities/product/Product";
import { cn } from "@/presentation/components/ui";
import { ProductCard, type ProductCardProps } from "./ProductCard";

export interface ProductGridProps {
  products: readonly Product[];
  headingLevel?: ProductCardProps["headingLevel"];
  sizes?: string;
  className?: string;
}

/** Responsive 1/2/3-column list of product cards. */
export function ProductGrid({ products, headingLevel, sizes, className }: ProductGridProps) {
  return (
    <ul className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {products.map((product) => (
        <li key={product.id.value} className="min-w-0">
          <ProductCard product={product} headingLevel={headingLevel} sizes={sizes} />
        </li>
      ))}
    </ul>
  );
}
