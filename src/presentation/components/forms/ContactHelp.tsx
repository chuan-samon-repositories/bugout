import Link from "next/link";
import type { ReactNode } from "react";
import { freeShippingThreshold, type PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { canPromiseReply } from "@/presentation/components/content/ContactChannel";
import { cn, focusRing, MailIcon, ReturnIcon, TruckIcon } from "@/presentation/components/ui";
import { isMessagingEnabled } from "@/presentation/config/messaging";
import { siteConfig } from "@/presentation/config/site";
import { formatMoney, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.forms.contact.help;
const linkClasses = cn("rounded-sm font-medium text-accent underline underline-offset-2 hover:no-underline", focusRing);

function HelpItem({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-accent">{icon}</span>
      <div className="min-w-0">
        <h3 className="font-bold text-navy-deep">{title}</h3>
        <div className="mt-1 space-y-1 text-sm text-muted">{children}</div>
      </div>
    </li>
  );
}

/**
 * Honest quick-help facts on the contact page: shipping area, returns and, when configured, an email. Sits next
 * to the contact form when messaging is enabled, and next to the FAQ otherwise.
 */
export function ContactHelp({ policy }: { policy: PricingPolicy }) {
  const threshold = freeShippingThreshold(policy);
  const formShown = isMessagingEnabled();
  return (
    <section aria-labelledby="contact-help-title" className="rounded-2xl bg-white p-6 shadow-card">
      <h2 id="contact-help-title" className="text-lg text-navy-deep">
        {canPromiseReply() ? copy.title : copy.titleWithoutChannel}
      </h2>
      <ul className="mt-4 space-y-5">
        <HelpItem icon={<TruckIcon />} title={copy.shippingTitle}>
          <p>{copy.shippingText}</p>
          {threshold && <p>{copy.freeShipping(formatMoney(threshold))}</p>}
        </HelpItem>
        <HelpItem icon={<ReturnIcon />} title={copy.returnsTitle}>
          <p>{copy.returnsText(siteConfig.returnWindowDays)}</p>
          <p>
            <Link href={routes.shippingReturns} className={linkClasses}>
              {copy.shippingReturnsLink}
            </Link>
          </p>
        </HelpItem>
        {siteConfig.contactEmail && (
          <HelpItem icon={<MailIcon />} title={copy.emailTitle}>
            <p>
              {formShown ? copy.emailTextBesideForm : copy.emailText}{" "}
              <a href={`mailto:${siteConfig.contactEmail}`} className={cn(linkClasses, "break-all")}>
                {siteConfig.contactEmail}
              </a>
              .
            </p>
          </HelpItem>
        )}
      </ul>
    </section>
  );
}
