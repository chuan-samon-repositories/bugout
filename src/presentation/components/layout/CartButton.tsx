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
        "relative inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white/8 text-sand transition-colors hover:bg-white/18",
        focusRing,
        "focus-visible:ring-offset-navy-darker",
      )}
    >
      <CartIcon className="size-5" />
      {itemCount > 0 && (
        <span
          key={itemCount}
          aria-hidden="true"
          className="absolute -top-1 -right-1 inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-orange px-1 text-[0.625rem] font-extrabold text-navy-deep transition-transform duration-200 starting:scale-125 motion-reduce:transition-none"
        >
          {itemCount > 99 ? "99+" : formatNumber(itemCount)}
        </span>
      )}
    </button>
  );
}
