"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommerceProvider } from "@/application/dtos/Checkout";
import type { OrderConfirmation } from "@/application/dtos/Order";
import { getContainer } from "@/infrastructure/config";
import { ButtonLink, CartIcon, Container, PageHeader, Spinner } from "@/presentation/components/ui";
import { useCart } from "@/presentation/context/CartContext";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { HostedCheckoutRedirect } from "./HostedCheckoutRedirect";
import { LocalCheckout } from "./LocalCheckout";
import { OrderConfirmationView } from "./OrderConfirmationView";
import { clearLastOrder, readLastOrder, saveLastOrder } from "./storedOrder";

export interface CheckoutFlowProps {
  provider: CommerceProvider;
}

const copy = messages.checkout;

function EmptyCheckout() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-muted/30 px-4 py-16 text-center">
      <CartIcon className="size-12 text-navy/60" />
      <h2 className="text-2xl font-bold tracking-tight text-ink">{copy.empty.title}</h2>
      <p className="max-w-md text-muted">{copy.empty.text}</p>
      <ButtonLink href={routes.products} size="lg" className="mt-2">
        {copy.empty.cta}
      </ButtonLink>
    </div>
  );
}

/**
 * /checkout: waits for the stored cart (never redirects), then shows the empty state,
 * the hosted-checkout hand-off (Shopify) or the local demo checkout and its confirmation.
 */
export function CheckoutFlow({ provider }: CheckoutFlowProps) {
  const { cart, ready, checkout } = useCart();
  const [policy] = useState(() => getContainer().getPricingPolicy());
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [storageChecked, setStorageChecked] = useState(false);
  const hasItems = cart !== null && !cart.isEmpty();

  useEffect(() => {
    if (!ready || storageChecked || confirmation) return;
    if (hasItems) {
      clearLastOrder();
    } else {
      const stored = readLastOrder();
      if (stored) setConfirmation(stored);
    }
    setStorageChecked(true);
  }, [ready, storageChecked, confirmation, hasItems]);

  /** The cart itself is refreshed by `runExclusive` in LocalCheckout; this only switches to the confirmation. */
  const handleOrderPlaced = useCallback((placed: OrderConfirmation) => {
    saveLastOrder(placed);
    setConfirmation(placed);
  }, []);

  if (confirmation) {
    return <OrderConfirmationView confirmation={confirmation} policy={policy} />;
  }

  let body;
  if (!ready || (!hasItems && !storageChecked)) {
    body = (
      <div className="flex justify-center py-16 text-navy">
        <Spinner size="lg" label={copy.loadingCart} />
      </div>
    );
  } else if (!cart || !hasItems) {
    body = <EmptyCheckout />;
  } else if (provider === "shopify") {
    body = <HostedCheckoutRedirect checkout={checkout} />;
  } else {
    body = <LocalCheckout cart={cart} policy={policy} onOrderPlaced={handleOrderPlaced} />;
  }

  return (
    <Container className="pb-16">
      <PageHeader
        title={copy.title}
        breadcrumbs={[{ label: messages.common.home, href: routes.home }, { label: copy.title }]}
      />
      {body}
    </Container>
  );
}
