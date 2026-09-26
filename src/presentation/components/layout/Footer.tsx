import Link from "next/link";
import { NewsletterForm } from "@/presentation/components/forms/NewsletterForm";
import { Container, focusRing } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { CookieSettingsButton } from "./CookieSettingsButton";
import { shopLinks, type NavLink } from "./navigation";

const copy = messages.shell.footer;
const nav = messages.shell.nav;

const linkClass = cn(
  "inline-flex min-h-11 items-center rounded-sm text-sand underline-offset-4 hover:text-orange-on-navy hover:underline sm:min-h-9",
  focusRing,
  "focus-visible:ring-orange-on-navy focus-visible:ring-offset-navy-deep",
);

const columns: { title: string; links: NavLink[]; cookieSettings?: boolean }[] = [
  { title: copy.columns.shop, links: shopLinks },
  {
    title: copy.columns.help,
    links: [
      { href: routes.shippingReturns, label: copy.shippingReturns },
      { href: routes.contact, label: nav.contact },
    ],
  },
  { title: copy.columns.company, links: [{ href: routes.about, label: nav.about }] },
  {
    title: copy.columns.legal,
    links: [
      { href: routes.privacy, label: copy.privacy },
      { href: routes.cookies, label: copy.cookies },
      { href: routes.terms, label: copy.terms },
    ],
    cookieSettings: true,
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-deep text-white">
      <Container className="grid gap-10 py-12 lg:grid-cols-12 lg:gap-8">
        <div className="min-w-0 lg:col-span-4">
          <p className="text-2xl font-extrabold tracking-wider text-orange-on-navy">{messages.common.brand}</p>
          <p className="mt-3 max-w-sm text-sand">{copy.blurb}</p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
          {columns.map((column) => (
            <div key={column.title} className="min-w-0">
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">{column.title}</h2>
              <ul className="mt-3 space-y-1 text-sm">
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
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="grid gap-4 py-8 md:grid-cols-2 md:items-center md:gap-8">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">{copy.newsletterTitle}</h2>
            <p className="mt-1 text-sm text-sand">{copy.newsletterText}</p>
          </div>
          <div className="min-w-0">
            <NewsletterForm location="footer" tone="dark" />
          </div>
        </Container>
      </div>
      <div className="border-t border-white/10">
        <Container className="py-6">
          <p className="text-sm text-sand">{copy.copyright(year)}</p>
        </Container>
      </div>
    </footer>
  );
}
