"use client";

import { useEffect, useRef } from "react";
import type { OrderConfirmation } from "@/application/dtos/Order";
import type { PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { Money } from "@/domain/value-objects/Money";
import { ButtonLink, CheckCircleIcon, Container, InfoIcon } from "@/presentation/components/ui";
import { siteConfig } from "@/presentation/config/site";
import { formatDate, formatMoney, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { OrderTotalsList } from "./OrderTotalsList";
import { deliveryEstimate, shippingMethodLabel } from "./shippingCopy";

export interface OrderConfirmationViewProps {
  confirmation: OrderConfirmation;
  policy: PricingPolicy;
}

const copy = messages.checkout.confirmation;

/** Rendered only from the order snapshot, never from the (now empty) cart. */
export function OrderConfirmationView({ confirmation, policy }: OrderConfirmationViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const currency = confirmation.totals.total.currency;
  const rate = policy.shippingRates.find((candidate) => candidate.id === confirmation.shippingMethod);
  const method = shippingMethodLabel({ id: confirmation.shippingMethod });

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // The confirmation replaces the checkout in place, so the tab title says so too (restored on unmount).
  useEffect(() => {
    const previous = document.title;
    document.title = `${copy.documentTitle} · ${siteConfig.name}`;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto size-12 text-success" />
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-4 text-3xl text-navy-deep focus-visible:outline-none sm:text-4xl"
          >
            {copy.title}
          </h1>
        </div>

        <p className="mt-6 flex items-start gap-3 rounded-2xl bg-sand-dim p-4 text-sm font-semibold text-navy-deep">
          <InfoIcon className="mt-0.5 size-5 shrink-0 text-accent" />
          <span className="min-w-0">{messages.checkout.review.demoNotice}</span>
        </p>

        {/* ph-no-capture: PostHog autocapture never records the customer's details. */}
        <dl className="ph-no-capture mt-8 grid gap-4 rounded-2xl bg-white shadow-card p-5 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-muted">{copy.orderNumber}</dt>
            <dd className="mt-1 break-all font-mono text-base font-bold text-navy-deep">{confirmation.orderNumber}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted">{copy.email}</dt>
            <dd className="mt-1 break-all font-medium text-ink">{confirmation.email}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted">{copy.placedAt}</dt>
            <dd className="mt-1 font-medium text-ink">{formatDate(confirmation.placedAt)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted">{copy.shippingMethod}</dt>
            <dd className="mt-1 font-medium text-ink">
              {method}
              {rate && <span className="block font-normal text-muted">{deliveryEstimate(rate)}</span>}
            </dd>
          </div>
        </dl>

        <section aria-labelledby="confirmation-items-title" className="mt-8 rounded-2xl bg-white shadow-card p-5">
          <h2 id="confirmation-items-title" className="font-bold text-navy-deep">
            {copy.items}
          </h2>
          <ul className="mt-3 divide-y divide-muted/20">
            {confirmation.lines.map((line) => (
              <li key={line.productId} className="flex items-start justify-between gap-4 py-3 text-sm">
                <span className="min-w-0 break-words text-ink">
                  {line.name}
                  <span className="block text-muted">{messages.checkout.summary.quantity(line.quantity)}</span>
                </span>
                <span className="shrink-0 font-bold text-navy-deep tabular-nums">
                  {formatMoney(Money.fromMinor(line.subtotalMinor, currency))}
                </span>
              </li>
            ))}
          </ul>
          <OrderTotalsList
            totals={confirmation.totals}
            policy={policy}
            shippingLabel={method}
            className="mt-3 border-t border-muted/30 pt-4"
          />
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href={routes.products} size="lg">
            {copy.continueShopping}
          </ButtonLink>
          <ButtonLink href={routes.home} variant="secondary" size="lg">
            {copy.home}
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
