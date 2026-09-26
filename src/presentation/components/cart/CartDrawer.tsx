"use client";

import { useRef, useState } from "react";
import { getContainer } from "@/infrastructure/config";
import { Button, ButtonLink, CartIcon, Drawer, Spinner } from "@/presentation/components/ui";
import { useCart } from "@/presentation/context/CartContext";
import { formatMoney, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { CartLine } from "./CartLine";
import { ClearCartControl } from "./ClearCartControl";
import { FreeShippingProgress } from "./FreeShippingProgress";

const copy = messages.cart;

/** Right-hand cart drawer wired to the cart context. */
export function CartDrawer() {
  const { cart, ready, pending, subtotal, isOpen, closeCart, setItemQuantity, removeItem, clearCart, checkout } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const policy = getContainer().getPricingPolicy();
  const items = cart?.getItems() ?? [];
  const hasItems = ready && items.length > 0;

  /** Keeps focus inside the dialog when the focused control is about to disappear (removed line, emptied cart). */
  const refocus = () => {
    const active = document.activeElement;
    if (!active || active === document.body || bodyRef.current?.contains(active)) bodyRef.current?.focus();
  };

  const onRemove = async (productId: string) => {
    await removeItem(productId);
    refocus();
  };

  const onClear = async () => {
    await clearCart();
    refocus();
  };

  const onCheckout = async () => {
    setCheckingOut(true);
    try {
      await checkout();
    } finally {
      setCheckingOut(false);
    }
  };

  const footer =
    hasItems && subtotal ? (
      <div className="flex flex-col gap-3">
        <FreeShippingProgress subtotal={subtotal} policy={policy} />
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-semibold text-ink">{copy.subtotal}</span>
          <span className="text-lg font-bold text-ink">{formatMoney(subtotal)}</span>
        </div>
        <p className="text-xs text-muted">{policy.pricesIncludeTax ? copy.taxIncluded : copy.taxExcluded}</p>
        <Button fullWidth size="lg" loading={checkingOut || pending} onClick={onCheckout}>
          {copy.checkout}
        </Button>
        <Button fullWidth variant="secondary" onClick={closeCart}>
          {copy.continueShopping}
        </Button>
      </div>
    ) : undefined;

  return (
    <Drawer open={isOpen} onClose={closeCart} side="right" title={copy.title} footer={footer}>
      <div ref={bodyRef} tabIndex={-1} className="outline-none">
        {!ready ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" className="text-navy" />
          </div>
        ) : hasItems ? (
          <>
            <ul aria-label={copy.lines} className="-mt-4 divide-y divide-sand">
              {items.map((item) => (
                <CartLine
                  key={item.product.id.value}
                  item={item}
                  disabled={pending}
                  onQuantityChange={setItemQuantity}
                  onRemove={onRemove}
                  onNavigate={closeCart}
                />
              ))}
            </ul>
            <div className="mt-2 flex justify-end">
              <ClearCartControl disabled={pending} onConfirm={onClear} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <CartIcon className="size-12 text-navy/40" />
            <p className="text-lg font-semibold text-ink">{copy.empty}</p>
            <p className="text-muted">{copy.emptyHint}</p>
            <ButtonLink href={routes.products} onClick={closeCart} className="mt-2">
              {copy.browseProducts}
            </ButtonLink>
          </div>
        )}
      </div>
    </Drawer>
  );
}
