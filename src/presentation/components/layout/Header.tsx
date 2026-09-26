import Link from "next/link";
import { Container, focusRing } from "@/presentation/components/ui";
import { cn } from "@/presentation/components/ui/cn";
import { CartDrawer } from "@/presentation/components/cart/CartDrawer";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { CartButton } from "./CartButton";
import { MobileMenu } from "./MobileMenu";
import { NavLinkList } from "./NavLinkList";
import { primaryLinks } from "./navigation";

const onNavyFocus = cn(focusRing, "focus-visible:ring-orange-on-navy focus-visible:ring-offset-navy");

export function Header() {
  return (
    <header className="sticky top-0 z-40 h-16 bg-navy text-white shadow-md">
      <Container className="flex h-full items-center gap-2">
        <MobileMenu />
        <Link
          href={routes.home}
          aria-label={messages.shell.logoLabel}
          className={cn("rounded-sm px-1 text-xl font-extrabold tracking-wider text-white hover:text-orange-on-navy", onNavyFocus)}
        >
          {messages.common.brand}
        </Link>
        <nav aria-label={messages.shell.nav.primary} className="ml-6 hidden min-w-0 lg:block">
          <NavLinkList
            links={primaryLinks}
            className="flex items-center gap-1"
            linkClassName={cn(
              "inline-flex min-h-11 items-center rounded-md px-2.5 text-sm font-medium whitespace-nowrap text-white/90 hover:text-orange-on-navy xl:px-3",
              onNavyFocus,
            )}
            currentClassName="text-white underline decoration-orange-on-navy decoration-2 underline-offset-8"
          />
        </nav>
        <div className="ml-auto flex items-center">
          <CartButton />
        </div>
      </Container>
      <CartDrawer />
    </header>
  );
}
