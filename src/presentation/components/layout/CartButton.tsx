"use client";

import { CartIcon, focusRing } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { useCart } from "@/presentation/context/CartContext";
import { formatNumber, messages } from "@/presentation/i18n";

const copy = messages.shell.cartButton;

/** Opens the cart drawer; its accessible name includes the item count. */
export function CartButton() {
  const { itemCount, openCart } = useCart();
  const label = itemCount > 0 ? copy.withItems(itemCount, formatNumber(itemCount)) : copy.empty;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={openCart}
      className={cn(
        "relative inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-2.5 text-white transition-colors hover:bg-white/10 sm:rounded-lg sm:px-3",
        focusRing,
        "focus-visible:ring-offset-navy",
      )}
    >
      <CartIcon className="size-6" />
      <span className="hidden text-sm font-semibold sm:inline">{copy.label}</span>
      {itemCount > 0 && (
        <span
          key={itemCount}
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-navy transition-transform duration-200 starting:scale-125 motion-reduce:transition-none sm:static sm:-ml-1"
        >
          {itemCount > 99 ? "99+" : formatNumber(itemCount)}
        </span>
      )}
    </button>
  );
}
