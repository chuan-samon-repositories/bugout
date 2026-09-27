import Link from "next/link";
import type { ResolvedContentLine } from "@/application/catalog";
import { ProductImage } from "@/presentation/components/catalog/ProductImage";
import { cn, focusRing } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.catalog.kit;

/** "× 2" after a line's name, only when there is more than one unit. */
const multiple = (quantity: string) => (quantity.trim() === "1" ? "" : ` ${copy.contentsQuantity(quantity)}`);

/** Placeholder square for kit lines that are not sold separately (water, food rations...). */
function GenericThumb({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex items-center justify-center font-bold", className)}>
      ?
    </span>
  );
}

/**
 * "El contenido, desplegado": a grid of the kit's lines on a dark background. Lines that
 * are catalog products show their photo and link to them.
 */
export function KitContentsGrid({ lines }: { lines: readonly ResolvedContentLine[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))]">
      {lines.map((line, index) => {
        const label = `${line.product?.name ?? line.item}${multiple(line.quantity)}`;
        const body = (
          <>
            <span className="relative mb-2.5 block aspect-square overflow-hidden rounded-lg bg-sand/8">
              {line.product ? (
                <ProductImage product={line.product} sizes="160px" />
              ) : (
                <GenericThumb className="absolute inset-0 text-2xl text-sand/50" />
              )}
            </span>
            <span className="block text-[0.8125rem] font-semibold text-sand">{label}</span>
          </>
        );
        const boxClass = "block h-full rounded-lg border border-sand/12 bg-sand/6 p-3.5 text-center";
        return (
          <li key={`${index}-${line.item}`} className="min-w-0">
            {line.product ? (
              <Link
                href={routes.product(line.product.slug)}
                className={cn(
                  boxClass,
                  "transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-sand/14",
                  focusRing,
                  "focus-visible:ring-orange-on-navy focus-visible:ring-offset-navy-deep",
                )}
              >
                {body}
              </Link>
            ) : (
              <div className={boxClass}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** "Contenido completo": one row per line with a thumbnail, the product link and the quantity. */
export function KitContentsList({ lines }: { lines: readonly ResolvedContentLine[] }) {
  return (
    <ul className="max-w-2xl">
      {lines.map((line, index) => (
        <li key={`${index}-${line.item}`} className="flex items-center gap-4 border-b border-sand-line py-3">
          <span aria-hidden="true" className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-navy">
            {line.product ? (
              <ProductImage product={line.product} sizes="48px" />
            ) : (
              <GenericThumb className="absolute inset-0 text-sand/60" />
            )}
          </span>
          {line.product ? (
            <Link
              href={routes.product(line.product.slug)}
              className={cn("min-w-0 flex-1 rounded-sm font-semibold text-navy-deep hover:text-accent hover:underline", focusRing)}
            >
              {line.product.name}
            </Link>
          ) : (
            <span className="min-w-0 flex-1 font-semibold text-navy-deep">{line.item}</span>
          )}
          <span className="shrink-0 text-sm font-bold text-muted">{copy.contentsQuantity(line.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}
