import { getContainer } from "@/infrastructure/config";

/**
 * The one place that decides whether the newsletter and the contact form are offered.
 *
 * They are shown only when a real mail/CRM backend delivers their submissions. While the adapters only
 * simulate delivery (`getContainer().isMessagingSimulated()`), the UI hides them: the home newsletter section,
 * the footer sign-up, the contact form, the checkout marketing opt-in and the matching privacy-policy
 * sections. They reappear automatically once messaging is connected.
 */
export function isMessagingEnabled(): boolean {
  return !getContainer().isMessagingSimulated();
}
