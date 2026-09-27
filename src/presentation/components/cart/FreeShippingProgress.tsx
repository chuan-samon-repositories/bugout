import { freeShippingThreshold, type PricingPolicy } from "@/domain/entities/order/OrderPricing";
import type { Money } from "@/domain/value-objects/Money";
import { formatMoney, messages } from "@/presentation/i18n";

const copy = messages.cart;

interface FreeShippingProgressProps {
  subtotal: Money;
  policy: PricingPolicy;
}

/** How far the cart is from the policy's free-shipping threshold. Renders nothing when there is none. */
export function FreeShippingProgress({ subtotal, policy }: FreeShippingProgressProps) {
  const threshold = freeShippingThreshold(policy);
  if (!threshold || threshold.currency !== subtotal.currency || threshold.isZero()) return null;

  const rate = policy.shippingRates.find((candidate) => candidate.freeFrom?.equals(threshold));
  const method = messages.common.shippingMethods[rate?.id ?? "standard"].toLowerCase();
  const reached = subtotal.greaterThanOrEqual(threshold);
  const percent = reached ? 100 : Math.round((subtotal.minor / threshold.minor) * 100);

  return (
    <div className="rounded-xl bg-sand px-4 py-3">
      <p className="text-sm font-semibold text-navy-deep">
        {reached
          ? copy.freeShippingReached(method)
          : copy.freeShippingRemaining(formatMoney(threshold.subtract(subtotal)), method)}
      </p>
      <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
        <div
          className={reached ? "h-full rounded-full bg-success" : "h-full rounded-full bg-orange"}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
