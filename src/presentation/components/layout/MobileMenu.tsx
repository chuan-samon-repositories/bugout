"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { ButtonLink, Drawer, IconButton, MenuIcon } from "@/presentation/components/ui";
import { useCart } from "@/presentation/context/CartContext";
import { messages } from "@/presentation/i18n";
import { NavLinkList } from "./NavLinkList";
import { primaryLinks, type NavKit } from "./navigation";

export interface MobileMenuProps {
  kits: readonly NavKit[];
  /** Where "Compra ahora" goes (the flagship kit). */
  ctaHref: string;
}

/** Menu button and dark drawer with the primary navigation, for screens below lg. */
export function MobileMenu({ kits, ctaHref }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const links = useMemo(() => primaryLinks(kits), [kits]);
  const panelId = useId();
  const pathname = usePathname();
  const { isOpen: cartOpen } = useCart();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (cartOpen) setOpen(false);
  }, [cartOpen]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <IconButton
        label={messages.shell.menu.open}
        variant="inverse"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <MenuIcon className="size-6" />
      </IconButton>
      <Drawer
        open={open}
        onClose={close}
        side="right"
        tone="dark"
        title={messages.shell.menu.title}
        footer={
          <ButtonLink href={ctaHref} onClick={close} size="lg" fullWidth>
            {messages.shell.nav.cta}
          </ButtonLink>
        }
      >
        <nav id={panelId} aria-label={messages.shell.nav.primary}>
          <NavLinkList
            links={links}
            onNavigate={close}
            className="-mx-2 flex flex-col gap-1"
            linkClassName="flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-sand hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-on-navy"
            currentClassName="bg-white/10 text-orange-on-navy"
          />
        </nav>
      </Drawer>
    </div>
  );
}
