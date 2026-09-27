import Link from "next/link";
import type { PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { ReturnIcon, TruckIcon, focusRing, cn } from "@/presentation/components/ui";
import { siteConfig } from "@/presentation/config/site";
import { formatMoney, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { deliveryFacts } from "./deliveryFacts";

/** Shipping and returns summary for the product page, quoted from the pricing policy. */
export function DeliveryInfo({ policy }: { policy: PricingPolicy }) {
  const t = messages.catalog.delivery;
  const { standard, freeFrom } = deliveryFacts(policy);

  return (
    <section aria-labelledby="delivery-info-title" className="rounded-2xl bg-white p-5 shadow-card">
      <h2 id="delivery-info-title" className="text-base text-navy-deep">
        {t.title}
      </h2>
      <ul className="mt-3 flex flex-col gap-3 text-sm text-ink">
        {standard && (
          <li className="flex items-start gap-3">
            <TruckIcon className="mt-0.5 size-5 shrink-0 text-accent" />
            <span className="min-w-0">
              {t.standard(formatMoney(standard.price), standard.deliveryDays.min, standard.deliveryDays.max)}
              {freeFrom && <span className="block text-muted">{t.freeFrom(formatMoney(freeFrom))}</span>}
            </span>
          </li>
        )}
        <li className="flex items-start gap-3">
          <ReturnIcon className="mt-0.5 size-5 shrink-0 text-accent" />
          <span className="min-w-0">{t.returns(siteConfig.returnWindowDays)}</span>
        </li>
      </ul>
      <Link
        href={routes.shippingReturns}
        className={cn("mt-4 inline-block rounded-sm text-sm font-bold text-accent underline underline-offset-4 hover:text-accent-hover", focusRing)}
      >
        {t.moreInfo}
      </Link>
    </section>
  );
}
