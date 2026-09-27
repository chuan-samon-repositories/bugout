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
        <nav aria-label={messages.shell.nav.primary} className="hidden min-w-0 flex-1 justify-center lg:flex">
          <NavLinkList
            links={links}
            className="flex items-center gap-1 xl:gap-2"
            linkClassName={cn(
              "relative inline-flex min-h-11 items-center rounded-md px-1.5 text-[0.8125rem] font-semibold whitespace-nowrap text-sand/85 transition-colors hover:text-sand xl:px-2",
              "after:absolute after:bottom-2 after:left-1.5 after:h-0.5 after:w-0 after:bg-orange after:transition-[width] after:duration-250 after:ease-brand hover:after:w-[calc(100%-0.75rem)] xl:after:left-2 xl:hover:after:w-[calc(100%-1rem)]",
              focusRing,
              "focus-visible:ring-offset-navy-darker",
            )}
            currentClassName="text-sand after:w-[calc(100%-0.75rem)] xl:after:w-[calc(100%-1rem)]"
          />
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-3.5">
          <CartButton />
          <ButtonLink href={ctaHref} size="md" className="hidden sm:inline-flex">
            {messages.shell.nav.cta}
          </ButtonLink>
          <MobileMenu kits={nav.kits} ctaHref={ctaHref} />
        </div>
      </Container>
      <CartDrawer />
    </HeaderShell>
  );
}
