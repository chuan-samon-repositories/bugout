import Link from "next/link";
import type { ReactNode } from "react";
import type { PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { canPromiseReply, ContactChannel } from "@/presentation/components/content/ContactChannel";
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
export const faqLinkClasses = cn("rounded-sm font-semibold text-accent underline underline-offset-2 hover:no-underline", focusRing);

/** One collapsible question (a native <details>). */
export function FaqItem({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl bg-white shadow-card">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 font-bold text-navy-deep [&::-webkit-details-marker]:hidden",
          focusRing,
        )}
      >
        <span className="min-w-0">{question}</span>
        <ChevronDownIcon className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2 px-5 pb-5 text-muted">{children}</div>
    </details>
  );
}

/**
 * Frequent questions on the contact page. Answers that consist of "write to us" (wholesale, order status) are
 * shown only when a message really reaches the shop (an email is configured or the contact form is connected).
 */
export function ContactFaq({ policy, title = copy.title }: { policy: PricingPolicy; title?: string }) {
  const hasChannel = canPromiseReply();
  return (
    <section aria-labelledby="contact-faq-title">
      <h2 id="contact-faq-title" className="text-2xl text-navy-deep">
        {title}
      </h2>
      <div className="mt-6 space-y-3">
        <FaqItem question={copy.returnsQuestion}>
          <p>
            {copy.returnsAnswer(siteConfig.returnWindowDays)}{" "}
            <Link href={routes.shippingReturns} className={faqLinkClasses}>
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
        {hasChannel && (
          <FaqItem question={copy.wholesaleQuestion}>
            <p>
              {copy.wholesaleLead} <ContactChannel capitalized topic="wholesale" linkClassName={faqLinkClasses} />{" "}
              {copy.wholesaleAnswer}
            </p>
          </FaqItem>
        )}
        {hasChannel && (
          <FaqItem question={copy.orderStatusQuestion}>
            <p>
              <ContactChannel capitalized topic="order" linkClassName={faqLinkClasses} /> {copy.orderStatusAnswer}
            </p>
          </FaqItem>
        )}
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
