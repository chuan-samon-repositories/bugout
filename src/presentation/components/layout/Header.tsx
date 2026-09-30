import { CartDrawer } from "@/presentation/components/cart/CartDrawer";
import { ButtonLink, Container } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { BrandLogo } from "./BrandLogo";
import { CartButton } from "./CartButton";
import { HeaderShell } from "./HeaderShell";
import { MobileMenu } from "./MobileMenu";
import { primarySections, type NavData } from "./navigation";
import { PrimaryNav } from "./PrimaryNav";

export interface HeaderProps {
  /** Kits, categories and the flagship kit, loaded once by the root layout (empty when the catalog is unavailable). */
  nav: NavData;
}

export function Header({ nav }: HeaderProps) {
  const sections = primarySections(nav);
  const ctaHref = nav.flagshipSlug ? routes.product(nav.flagshipSlug) : routes.products;
  return (
    <HeaderShell>
      <Container className="flex h-full items-center gap-4">
        <BrandLogo />
        {/* From xl only: below 1280px the links, logo, cart and "Compra ahora" do not fit on one row, so the menu takes over. */}
        <nav aria-label={messages.shell.nav.primary} className="hidden min-w-0 flex-1 justify-center xl:flex">
          <PrimaryNav sections={sections} />
        </nav>
        <div className="ml-auto flex items-center gap-2 xl:ml-0 xl:gap-3.5">
          <CartButton />
          {/* Wrapped: cn() does not merge classes, so "hidden" on the link would lose to its inline-flex. */}
          <div className="hidden sm:block">
            <ButtonLink href={ctaHref} size="md">
              {messages.shell.nav.cta}
            </ButtonLink>
          </div>
          <MobileMenu sections={sections} ctaHref={ctaHref} />
        </div>
      </Container>
      <CartDrawer />
    </HeaderShell>
  );
}
