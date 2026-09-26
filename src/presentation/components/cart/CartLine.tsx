"use client";

import Link from "next/link";
import type { CartItem } from "@/domain/entities/cart/CartItem";
import { MAX_QUANTITY_PER_ITEM } from "@/domain/entities/cart/Cart";
import { ProductImage } from "@/presentation/components/catalog/ProductImage";
import { IconButton, MinusIcon, PlusIcon, TrashIcon, focusRing } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { formatMoney, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.cart;

interface CartLineProps {
  item: CartItem;
  disabled: boolean;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onNavigate: () => void;
}

export function CartLine({ item, disabled, onQuantityChange, onRemove, onNavigate }: CartLineProps) {
  const { product } = item;
  const id = product.id.value;
  const quantity = item.quantity.value;

  return (
    <li className="flex gap-3 py-4">
      <div aria-hidden="true" className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-sand/40">
        <ProductImage product={product} sizes="80px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={routes.product(product.slug)}
              onClick={onNavigate}
              className={cn("rounded-sm font-semibold break-words text-ink hover:text-accent hover:underline", focusRing)}
            >
              {product.name}
            </Link>
            <p className="mt-0.5 text-sm text-muted">
              <span className="sr-only">{copy.unitPrice}: </span>
              {formatMoney(product.price)}
            </p>
          </div>
          <IconButton label={copy.remove(product.name)} onClick={() => onRemove(id)} disabled={disabled} className="-mt-2 -mr-2">
            <TrashIcon className="size-5" />
          </IconButton>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center rounded-full border border-sand">
            <IconButton
              label={copy.decrease(product.name)}
              onClick={() => onQuantityChange(id, quantity - 1)}
              disabled={disabled || quantity <= 1}
            >
              <MinusIcon className="size-4" />
            </IconButton>
            <span aria-live="polite" aria-atomic="true" className="min-w-8 text-center font-semibold tabular-nums text-ink">
              <span className="sr-only">{copy.quantity}: </span>
              {quantity}
            </span>
            <IconButton
              label={copy.increase(product.name)}
              onClick={() => onQuantityChange(id, quantity + 1)}
              disabled={disabled || quantity >= MAX_QUANTITY_PER_ITEM}
            >
              <PlusIcon className="size-4" />
            </IconButton>
          </div>
          <p className="font-semibold text-ink">
            <span className="sr-only">{copy.lineSubtotal}: </span>
            {formatMoney(item.subtotal())}
          </p>
        </div>
      </div>
    </li>
  );
}
