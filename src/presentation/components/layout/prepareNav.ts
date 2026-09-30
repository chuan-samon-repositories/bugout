import { messages } from "@/presentation/i18n";
import { cardCategory } from "@/presentation/prepare/categories";
import { cardByCode } from "@/presentation/prepare/deck";
import { prepareAnchors, routes } from "@/presentation/routes";
import type { NavLink } from "./navigation";

const nav = messages.shell.nav;

/**
 * "Prepárate" dropdown: the card to start with, then the Prepárate page's main sections. Server-only in
 * practice (the header builds it): it reads the card deck, which client code must not bundle.
 */
export function prepareLinks(): NavLink[] {
  const firstMinutes = cardByCode("PM-01");
  const firstAid = cardCategory("pa");
  return [
    ...(firstMinutes ? [{ href: routes.actionCard(firstMinutes.slug), label: firstMinutes.title }] : []),
    { href: routes.prepareSection(prepareAnchors.steps), label: nav.prepareSteps },
    { href: routes.prepareSection(prepareAnchors.cards), label: nav.prepareCards },
    { href: routes.prepareSection(firstAid.anchor), label: nav.prepareFirstAid },
  ];
}
