"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommerceProvider } from "@/application/dtos/Checkout";
import type { OrderConfirmation } from "@/application/dtos/Order";
import { getContainer } from "@/infrastructure/config";
import { AlertCircleIcon, Button, ButtonLink, CartIcon, Container, PageHeader, Spinner } from "@/presentation/components/ui";
import { useCart } from "@/presentation/context/CartContext";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { HostedCheckoutRedirect } from "./HostedCheckoutRedirect";
import { LocalCheckout } from "./LocalCheckout";
import { OrderConfirmationView } from "./OrderConfirmationView";

export interface CheckoutFlowProps {
  provider: CommerceProvider;
}

const copy = messages.checkout;

function EmptyCheckout() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white shadow-card px-4 py-16 text-center">
      <CartIcon className="size-12 text-navy/60" />
      <h2 className="text-2xl text-navy-deep">{copy.empty.title}</h2>
      <p className="max-w-md text-muted">{copy.empty.text}</p>
      <ButtonLink href={routes.products} size="lg" className="mt-2">
        {copy.empty.cta}
      </ButtonLink>
    </div>
  );
}

/** Same message and retry as the cart drawer when the stored cart could not be restored. */
function CartLoadError({ onRetry }: { onRetry(): Promise<void> }) {
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-white shadow-card px-4 py-16 text-center">
      <AlertCircleIcon className="size-12 text-danger" />
      <p className="text-lg font-bold text-navy-deep">{messages.cart.loadError}</p>
      <Button variant="secondary" onClick={() => void retry()} loading={retrying} className="mt-2">
        {messages.cart.retryLoad}
      </Button>
    </div>
  );
}

/**
 * /checkout: waits for the stored cart (never redirects), then shows the load error, the empty state,
 * the hosted-checkout hand-off (Shopify) or the local demo checkout and its confirmation.
 */
export function CheckoutFlow({ provider }: CheckoutFlowProps) {
  const { cart, ready, loadError, checkout, refresh } = useCart();
  const [{ policy, confirmations }] = useState(() => {
    const container = getContainer();
    return { policy: container.getPricingPolicy(), confirmations: container.getOrderConfirmationStore() };
  });
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [storageChecked, setStorageChecked] = useState(false);
  const hasItems = cart !== null && !cart.isEmpty();

  useEffect(() => {
    if (!ready || storageChecked || confirmation) return;
    if (hasItems) {
      confirmations.clear();
    } else {
      const stored = confirmations.load();
      if (stored) setConfirmation(stored);
    }
    setStorageChecked(true);
  }, [ready, storageChecked, confirmation, hasItems, confirmations]);

  /** The cart itself is refreshed by `runExclusive` in LocalCheckout; this only switches to the confirmation. */
  const handleOrderPlaced = useCallback(
    (placed: OrderConfirmation) => {
      confirmations.save(placed);
      setConfirmation(placed);
    },
    [confirmations],
  );

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
  } else if (loadError && !hasItems) {
    body = <CartLoadError onRetry={refresh} />;
  } else if (!cart || !hasItems) {
    body = <EmptyCheckout />;
  } else if (provider === "shopify") {
    body = <HostedCheckoutRedirect checkout={() => checkout({ replace: true })} />;
  } else {
    body = <LocalCheckout cart={cart} policy={policy} onOrderPlaced={handleOrderPlaced} />;
  }

  return (
    <Container className="pb-24">
      <PageHeader
        tone="plain"
        title={copy.title}
        breadcrumbs={[{ label: messages.common.home, href: routes.home }, { label: copy.title }]}
      />
      {body}
    </Container>
  );
}
