"use client";

import { useId, useMemo, useState } from "react";
import { MAX_QUANTITY_PER_ITEM } from "@/domain/entities/cart/Cart";
import { Button, CartIcon, IconButton, MinusIcon, PlusIcon, cn } from "@/presentation/components/ui";
import { useCart } from "@/presentation/context/CartContext";
import { messages } from "@/presentation/i18n";
import { fromProductSnapshot, type ProductSnapshot } from "./productSnapshot";

export interface AddToCartProps {
  product: ProductSnapshot;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function AddToCart({ product: snapshot }: AddToCartProps) {
  const t = messages.catalog.product;
  const product = useMemo(() => fromProductSnapshot(snapshot), [snapshot]);
  const { cart, addItem, pending } = useCart();
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const [draft, setDraft] = useState("1");
  const [adding, setAdding] = useState(false);

  if (!product.inStock) {
    return (
      <Button size="lg" fullWidth disabled>
        {t.outOfStock}
      </Button>
    );
  }

  const inCart = cart?.quantityOf(product.id) ?? 0;
  const max = Math.max(0, MAX_QUANTITY_PER_ITEM - inCart);

  if (max === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-xl bg-sand-dim/60 px-4 py-3 text-sm font-semibold text-navy-deep" role="status">
          {t.maxReached}
        </p>
        <Button size="lg" fullWidth disabled>
          <CartIcon />
          {t.addToCart}
        </Button>
      </div>
    );
  }

  const parsed = Number.parseInt(draft, 10);
  const quantity = clamp(Number.isNaN(parsed) ? 1 : parsed, 1, max);

  const handleAdd = async () => {
    setAdding(true);
    try {
      if (await addItem(product, quantity)) setDraft("1");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0">
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-bold text-navy-deep">
            {t.quantity}
          </label>
          <div className="flex items-center gap-1 rounded-full border-[1.5px] border-muted/60 bg-white p-0.5">
            <IconButton label={t.decrease} onClick={() => setDraft(String(quantity - 1))} disabled={quantity <= 1}>
              <MinusIcon />
            </IconButton>
            <input
              id={inputId}
              type="number"
              inputMode="numeric"
              min={1}
              max={max}
              step={1}
              value={draft}
              aria-describedby={inCart > 0 ? hintId : undefined}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => setDraft(String(quantity))}
              className={cn(
                "w-14 min-w-0 appearance-none bg-transparent text-center text-base font-semibold text-ink",
                "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              )}
            />
            <IconButton label={t.increase} onClick={() => setDraft(String(quantity + 1))} disabled={quantity >= max}>
              <PlusIcon />
            </IconButton>
          </div>
        </div>
        <Button
          size="lg"
          className="min-w-0 flex-1 basis-48"
          loading={adding}
          // The cart drawer opens while this is loading and returns focus here when it closes.
          focusableWhileLoading
          disabled={pending && !adding}
          onClick={handleAdd}
        >
          {!adding && <CartIcon />}
          {t.addToCart}
        </Button>
      </div>
      {inCart > 0 && (
        <p id={hintId} className="text-sm text-muted">
          {t.inCart(inCart)} {t.maxHint(max)}
        </p>
      )}
    </div>
  );
}
