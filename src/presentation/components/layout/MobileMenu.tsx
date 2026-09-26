"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Drawer, IconButton, MenuIcon } from "@/presentation/components/ui";
import { useCart } from "@/presentation/context/CartContext";
import { messages } from "@/presentation/i18n";
import { NavLinkList } from "./NavLinkList";
import { primaryLinks } from "./navigation";

/** Menu button and left drawer with the primary navigation, for screens below lg. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
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
      <Drawer open={open} onClose={close} side="left" title={messages.shell.menu.title}>
        <nav id={panelId} aria-label={messages.shell.nav.primary}>
          <NavLinkList
            links={primaryLinks}
            onNavigate={close}
            className="-mx-2 flex flex-col"
            linkClassName="flex min-h-12 items-center rounded-lg px-2 text-base font-medium text-ink hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            currentClassName="bg-sand/60 font-semibold text-navy"
          />
        </nav>
      </Drawer>
    </div>
  );
}
