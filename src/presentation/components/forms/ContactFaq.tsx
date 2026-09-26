import Link from "next/link";
import type { ReactNode } from "react";
import type { PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { ChevronDownIcon, cn, focusRing } from "@/presentation/components/ui";
import { siteConfig } from "@/presentation/config/site";
import { formatMoney, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import {
  deliveryEstimate,
  formatShippingPrice,
  formatTaxRate,
  shippingMethodLabel,
} from "@/presentation/components/checkout/shippingCopy";

const copy = messages.forms.contact.faq;
const topics = messages.forms.contact.topics;

function FaqItem({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details className="group rounded-lg border border-muted/30 bg-white">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg p-4 font-semibold text-ink [&::-webkit-details-marker]:hidden",
          focusRing,
        )}
      >
        <span className="min-w-0">{question}</span>
        <ChevronDownIcon className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2 px-4 pb-4 text-muted">{children}</div>
    </details>
  );
}

export function ContactFaq({ policy }: { policy: PricingPolicy }) {
  return (
    <section aria-labelledby="contact-faq-title">
      <h2 id="contact-faq-title" className="text-2xl font-bold tracking-tight text-ink">
        {copy.title}
      </h2>
      <div className="mt-6 space-y-3">
        <FaqItem question={copy.returnsQuestion}>
          <p>
            {copy.returnsAnswer(siteConfig.returnWindowDays)}{" "}
            <Link
              href={routes.shippingReturns}
              className={cn("rounded-sm text-accent underline underline-offset-2 hover:no-underline", focusRing)}
            >
              {copy.returnsLink}
            </Link>
            .
          </p>
        </FaqItem>
        <FaqItem question={copy.shippingQuestion}>
          <p>{copy.shippingAnswer}</p>
          <ul className="list-disc space-y-1 pl-5">
            {policy.shippingRates.map((rate) => {
              const price = rate.freeFrom
                ? `${formatShippingPrice(rate.price)}, ${copy.freeFrom(formatMoney(rate.freeFrom))}`
                : formatShippingPrice(rate.price);
              return (
                <li key={rate.id}>{copy.shippingRate(shippingMethodLabel(rate), deliveryEstimate(rate).toLowerCase(), price)}</li>
              );
            })}
          </ul>
        </FaqItem>
        <FaqItem question={copy.wholesaleQuestion}>
          <p>{copy.wholesaleAnswer(topics.wholesale)}</p>
        </FaqItem>
        <FaqItem question={copy.orderStatusQuestion}>
          <p>{copy.orderStatusAnswer(topics.order)}</p>
        </FaqItem>
        <FaqItem question={copy.taxQuestion}>
          <p>
            {policy.pricesIncludeTax
              ? copy.taxIncludedAnswer(formatTaxRate(policy))
              : copy.taxExcludedAnswer(formatTaxRate(policy))}
          </p>
        </FaqItem>
      </div>
    </section>
  );
}
