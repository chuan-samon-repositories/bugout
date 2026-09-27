import type { ComponentType } from "react";
import type { PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { deliveryFacts } from "@/presentation/components/catalog/deliveryFacts";
import { CalendarIcon, Container, MapPinIcon, ReturnIcon, TruckIcon, type IconProps } from "@/presentation/components/ui";
import { siteConfig } from "@/presentation/config/site";
import { formatMoney, messages } from "@/presentation/i18n";

const copy = messages.catalog.home;

interface TrustItem {
  icon: ComponentType<IconProps>;
  title: string;
  text: string;
}

/**
 * The trust bar's facts. Shipping comes from the pricing policy and returns from the
 * site config, so the copy can never promise more than checkout charges.
 */
export function trustItems(policy: PricingPolicy): TrustItem[] {
  const { standard, freeFrom } = deliveryFacts(policy);
  const items: TrustItem[] = [];
  if (standard) {
    items.push({
      icon: TruckIcon,
      title: freeFrom ? copy.trustFreeShipping(formatMoney(freeFrom)) : copy.trustShippingPrice(formatMoney(standard.price)),
      text: copy.trustDelivery(standard.deliveryDays.min, standard.deliveryDays.max),
    });
  }
  items.push(
    { icon: MapPinIcon, title: copy.trustRegionTitle, text: copy.trustRegionText },
    { icon: CalendarIcon, title: copy.trustExpiryTitle, text: copy.trustExpiryText },
    {
      icon: ReturnIcon,
      title: copy.trustReturnsTitle(siteConfig.returnWindowDays),
      text: copy.trustReturnsText,
    },
  );
  return items;
}

/** Section 7: the navy trust bar. */
export function TrustBar({ policy }: { policy: PricingPolicy }) {
  return (
    <section aria-labelledby="trust-title" className="pb-20 sm:pb-28">
      <h2 id="trust-title" className="sr-only">
        {copy.trustTitle}
      </h2>
      <Container>
        <ul className="grid overflow-hidden rounded-2xl bg-navy shadow-float sm:grid-cols-2 lg:grid-cols-4">
          {trustItems(policy).map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex items-center gap-3.5 border-b border-sand/10 px-6 py-6 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-r lg:border-b-0 lg:last:border-r-0"
            >
              <Icon className="size-7 shrink-0 text-orange-on-navy" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-sand">{title}</p>
                <p className="mt-0.5 text-[0.8125rem] text-sand/75">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
