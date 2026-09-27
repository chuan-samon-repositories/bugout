import { CartDrawer } from "@/presentation/components/cart/CartDrawer";
import { ButtonLink, Container, focusRing } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { BrandLogo } from "./BrandLogo";
import { CartButton } from "./CartButton";
import { HeaderShell } from "./HeaderShell";
import { MobileMenu } from "./MobileMenu";
import { NavLinkList } from "./NavLinkList";
import { primaryLinks, type NavData } from "./navigation";

export interface HeaderProps {
  /** Kits and the flagship kit, loaded once by the root layout (empty when the catalog is unavailable). */
  nav: NavData;
}

export function Header({ nav }: HeaderProps) {
  const links = primaryLinks(nav.kits);
  const ctaHref = nav.flagshipSlug ? routes.product(nav.flagshipSlug) : routes.products;
  return (
    <HeaderShell>
      <Container className="flex h-full items-center gap-4">
        <BrandLogo />
        {/* From xl only: below 1280px the links, logo, cart and "Compra ahora" do not fit on one row, so the menu takes over. */}
        <nav aria-label={messages.shell.nav.primary} className="hidden min-w-0 flex-1 justify-center xl:flex">
          <NavLinkList
            links={links}
            className="flex items-center gap-2"
            linkClassName={cn(
              "relative inline-flex min-h-11 items-center rounded-md px-2 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors hover:text-sand",
              "after:absolute after:bottom-2 after:left-2 after:h-0.5 after:w-0 after:bg-orange after:transition-[width] after:duration-250 after:ease-brand hover:after:w-[calc(100%-1rem)]",
              focusRing,
              "focus-visible:ring-offset-navy-darker",
            )}
            idleClassName="text-sand/85"
            currentClassName="text-sand after:w-[calc(100%-1rem)]"
          />
        </nav>
        <div className="ml-auto flex items-center gap-2 xl:ml-0 xl:gap-3.5">
          <CartButton />
          {/* Wrapped: cn() does not merge classes, so "hidden" on the link would lose to its inline-flex. */}
          <div className="hidden sm:block">
            <ButtonLink href={ctaHref} size="md">
              {messages.shell.nav.cta}
            </ButtonLink>
          </div>
          <MobileMenu kits={nav.kits} ctaHref={ctaHref} />
        </div>
      </Container>
      <CartDrawer />
    </HeaderShell>
  );
}
