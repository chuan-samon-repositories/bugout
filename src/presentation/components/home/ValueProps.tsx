import type { ComponentType } from "react";
import type { PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { deliveryFacts } from "@/presentation/components/catalog/deliveryFacts";
import { Container, PackageIcon, ReturnIcon, TruckIcon, type IconProps } from "@/presentation/components/ui";
import { siteConfig } from "@/presentation/config/site";
import { formatMoney, messages } from "@/presentation/i18n";

interface ValueProp {
  icon: ComponentType<IconProps>;
  title: string;
  text: string;
}

function valueProps(policy: PricingPolicy): ValueProp[] {
  const t = messages.catalog.home;
  const { standard, freeFrom } = deliveryFacts(policy);
  const shippingText = freeFrom
    ? t.shippingFree(formatMoney(freeFrom))
    : standard
      ? t.shippingPaid(formatMoney(standard.price))
      : null;

  const props: ValueProp[] = [{ icon: PackageIcon, title: t.readyTitle, text: t.readyText }];
  if (shippingText) {
    props.push({
      icon: TruckIcon,
      title: standard ? t.shippingTitle(standard.deliveryDays.min, standard.deliveryDays.max) : t.shippingTitleFallback,
      text: shippingText,
    });
  }
  props.push({
    icon: ReturnIcon,
    title: t.returnsTitle(siteConfig.returnWindowDays),
    text: t.returnsText(siteConfig.returnWindowDays),
  });
  return props;
}

export function ValueProps({ policy }: { policy: PricingPolicy }) {
  return (
    <section aria-labelledby="value-props-title" className="border-b border-sand bg-sand/30 py-12 sm:py-16">
      <Container>
        <h2 id="value-props-title" className="sr-only">
          {messages.catalog.home.valuePropsTitle}
        </h2>
        <ul className="grid gap-8 md:grid-cols-3">
          {valueProps(policy).map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                <Icon className="size-6" />
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
