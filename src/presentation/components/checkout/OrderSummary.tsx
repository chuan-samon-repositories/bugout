"use client";

import { useId, useState } from "react";
import type { Cart } from "@/domain/entities/cart/Cart";
import type { OrderTotals, PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { ProductImage } from "@/presentation/components/catalog/ProductImage";
import { ChevronDownIcon, cn, focusRing } from "@/presentation/components/ui";
import { formatMoney, messages } from "@/presentation/i18n";
import { OrderTotalsList } from "./OrderTotalsList";

export interface OrderSummaryProps {
  cart: Cart;
  totals: OrderTotals;
  policy: PricingPolicy;
  shippingLabel?: string;
  className?: string;
}

const copy = messages.checkout.summary;

/** Cart lines and totals. Collapsible on small screens, always open (and sticky) from lg. */
export function OrderSummary({ cart, totals, policy, shippingLabel, className }: OrderSummaryProps) {
  const [open, setOpen] = useState(false);
  const panelId = `order-summary-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const titleId = `${panelId}-title`;

  return (
    <aside aria-labelledby={titleId} className={cn("min-w-0 rounded-xl border border-muted/30 bg-sand/30", className)}>
      <h2 id={titleId} className="sr-only lg:not-sr-only lg:block lg:px-6 lg:pt-6 lg:text-lg lg:font-semibold lg:text-ink">
        {copy.title}
      </h2>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn("flex w-full items-center justify-between gap-4 rounded-xl p-4 text-left lg:hidden", focusRing)}
      >
        <span className="flex min-w-0 items-center gap-2 font-medium text-accent">
          {open ? copy.hide : copy.show}
          <ChevronDownIcon className={cn("size-5 shrink-0 transition-transform", open && "rotate-180")} />
        </span>
        <span className="shrink-0 text-lg font-bold text-ink tabular-nums">{formatMoney(totals.total)}</span>
      </button>
      <div id={panelId} className={cn(open ? "block" : "hidden", "px-4 pb-4 lg:block lg:px-6 lg:pb-6 lg:pt-4")}>
        <ul className="divide-y divide-muted/20">
          {cart.getItems().map((item) => (
            <li key={item.product.id.value} className="flex items-center gap-3 py-3">
              <div aria-hidden="true" className="relative size-16 shrink-0 overflow-hidden rounded-md border border-muted/20 bg-white">
                <ProductImage product={item.product} sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium text-ink">{item.product.name}</p>
                <p className="text-sm text-muted">{copy.quantity(item.quantity.value)}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-ink tabular-nums">{formatMoney(item.subtotal())}</p>
            </li>
          ))}
        </ul>
        <OrderTotalsList totals={totals} policy={policy} shippingLabel={shippingLabel} className="mt-4 border-t border-muted/30 pt-4" />
      </div>
    </aside>
  );
}
