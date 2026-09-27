import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/presentation/components/forms/NewsletterForm";
import { Container, focusRing } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { brandAssets } from "@/presentation/config/brand";
import { isMessagingEnabled } from "@/presentation/config/messaging";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { CookieSettingsButton } from "./CookieSettingsButton";
import { CopyrightNotice } from "./CopyrightNotice";
import { shopLinks, type NavKit, type NavLink } from "./navigation";

const copy = messages.shell.footer;
const nav = messages.shell.nav;
const wordmark = brandAssets.wordmarkStacked("cream");

const linkClass = cn(
  "inline-flex min-h-11 items-center rounded-sm text-sm text-sand/75 transition-colors hover:text-orange-on-navy sm:min-h-8",
  focusRing,
  "focus-visible:ring-orange-on-navy focus-visible:ring-offset-navy-darker",
);

interface FooterColumn {
  title: string;
  links: NavLink[];
  cookieSettings?: boolean;
}

function footerColumns(kits: readonly NavKit[]): FooterColumn[] {
  return [
    { title: copy.columns.shop, links: shopLinks(kits) },
    {
      title: copy.columns.company,
      links: [
        { href: routes.about, label: nav.about },
        { href: routes.whyPrepare, label: copy.whyPrepare },
        { href: routes.contact, label: nav.contact },
      ],
    },
    {
      title: copy.columns.help,
      links: [
        { href: routes.faq, label: copy.faq },
        { href: routes.shippingReturns, label: copy.shippingReturns },
      ],
    },
    {
      title: copy.columns.legal,
      links: [
        { href: routes.terms, label: copy.terms },
        { href: routes.privacy, label: copy.privacy },
        { href: routes.cookies, label: copy.cookies },
      ],
      cookieSettings: true,
    },
  ];
}

export interface FooterProps {
  /** Kits for the "Tienda" column, loaded once by the root layout. */
  kits: readonly NavKit[];
}

export function Footer({ kits }: FooterProps) {
  const columns = footerColumns(kits);

  return (
    <footer className="bg-navy-darker text-sand">
      <Container className="grid gap-10 pt-16 pb-12 sm:pt-20 lg:grid-cols-[1.6fr_repeat(4,1fr)] lg:gap-10">
        <div className="min-w-0">
          <Image
            src={wordmark.src}
            width={wordmark.width}
            height={wordmark.height}
            alt={copy.brandLabel}
            className="mb-5 h-auto w-36"
          />
          <p className="max-w-56 text-sm text-sand/75">{copy.blurb}</p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="min-w-0">
            <h2 className="mb-4 text-[0.8125rem] font-extrabold tracking-[0.06em] text-sand uppercase">{column.title}</h2>
            <ul className="space-y-0.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
              {column.cookieSettings && (
                <li>
                  <CookieSettingsButton className={cn(linkClass, "text-left")} />
                </li>
              )}
            </ul>
          </div>
        ))}
      </Container>
      {/* A full-width band of its own, so hiding it leaves the columns above untouched. */}
      {isMessagingEnabled() && (
        <div className="border-t border-sand/10">
          <Container className="grid gap-4 py-8 md:grid-cols-2 md:items-center md:gap-8">
            <div className="min-w-0">
              <h2 className="text-lg text-sand">{copy.newsletterTitle}</h2>
              <p className="mt-1 text-sm text-sand/75">{copy.newsletterText}</p>
            </div>
            <div className="min-w-0">
              <NewsletterForm location="footer" tone="dark" />
            </div>
          </Container>
        </div>
      )}
      <div className="border-t border-sand/10">
        <Container className="flex flex-wrap justify-between gap-x-6 gap-y-2 py-6 text-[0.8125rem] text-sand/70">
          <CopyrightNotice renderedYear={new Date().getFullYear()} />
          <p>{copy.closing}</p>
        </Container>
      </div>
    </footer>
  );
}
