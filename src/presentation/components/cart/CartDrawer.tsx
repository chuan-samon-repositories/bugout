"use client";

import { useRef, useState } from "react";
import { getContainer } from "@/infrastructure/config";
import { AlertCircleIcon, Button, ButtonLink, CartIcon, Drawer, Spinner } from "@/presentation/components/ui";
import { useCart } from "@/presentation/context/CartContext";
import { formatMoney, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { CartLine } from "./CartLine";
import { ClearCartControl } from "./ClearCartControl";
import { FreeShippingProgress } from "./FreeShippingProgress";

const copy = messages.cart;

/** Right-hand cart drawer wired to the cart context. */
export function CartDrawer() {
  const {
    cart,
    ready,
    loadError,
    pending,
    subtotal,
    isOpen,
    closeCart,
    setItemQuantity,
    removeItem,
    clearCart,
    checkout,
    refresh,
  } = useCart();
  const [retrying, setRetrying] = useState(false);
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

  const onRetry = async () => {
    setRetrying(true);
    try {
      await refresh();
    } finally {
      setRetrying(false);
    }
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
          <span className="font-bold text-navy-deep">{copy.subtotal}</span>
          <span className="text-xl font-extrabold text-navy-deep">{formatMoney(subtotal)}</span>
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
        ) : loadError && !hasItems ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircleIcon className="size-12 text-danger" />
            <p className="text-lg font-bold text-navy-deep">{copy.loadError}</p>
            <Button variant="secondary" onClick={() => void onRetry()} loading={retrying} className="mt-2">
              {copy.retryLoad}
            </Button>
          </div>
        ) : hasItems ? (
          <>
            <ul aria-label={copy.lines} className="-mt-4 divide-y divide-sand-line">
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
            <CartIcon className="size-12 text-navy/50" />
            <p className="text-lg font-bold text-navy-deep">{copy.empty}</p>
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
