import Link from "next/link";
import type { ContactTopic } from "@/application/dtos/Contact";
import { getContainer } from "@/infrastructure/config";
import { siteConfig } from "@/presentation/config/site";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.content.contactChannel;

export interface ContactChannelState {
  /** The shop's configured contact email, or null. */
  email: string | null;
  /** The contact form only simulates delivery (no mail/CRM backend connected). */
  messagingSimulated: boolean;
}

/** Where customer messages go right now. */
export function contactChannelState(): ContactChannelState {
  return { email: siteConfig.contactEmail, messagingSimulated: getContainer().isMessagingSimulated() };
}

/**
 * True when a customer message really reaches someone: an email is configured or the contact form is
 * connected. Otherwise copy must not promise a (personal) reply.
 */
export function canPromiseReply(state: ContactChannelState = contactChannelState()): boolean {
  return state.email !== null || !state.messagingSimulated;
}

export interface ContactChannelProps {
  /** Contact-form topic to preselect (and name) when there is no email. */
  topic?: ContactTopic;
  /** Starts a sentence ("Escríbenos…"). */
  capitalized?: boolean;
  /** Defaults to siteConfig.contactEmail. */
  email?: string | null;
  /** Classes for the link, when not rendered inside Prose (which styles plain links). */
  linkClassName?: string;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The one way legal and help copy tells customers how to reach the shop: "escríbenos a <email>" when a contact
 * email is configured, otherwise "escríbenos a través del formulario de contacto (con el tema «…»)".
 * Renders inline text without final punctuation, so it fits inside a sentence.
 */
export function ContactChannel({
  topic,
  capitalized = false,
  email = siteConfig.contactEmail,
  linkClassName,
}: ContactChannelProps) {
  const lead = (text: string) => (capitalized ? capitalize(text) : text);
  if (email) {
    return (
      <>
        {lead(copy.writeToEmail)} <a href={`mailto:${email}`} className={linkClassName}>
          {email}
        </a>
      </>
    );
  }
  const href = topic ? `${routes.contact}?topic=${topic}` : routes.contact;
  return (
    <>
      {lead(copy.writeViaForm)} <Link href={href} className={linkClassName}>
        {copy.formLink}
      </Link>
      {topic && ` ${copy.withTopic(messages.forms.contact.topics[topic])}`}
    </>
  );
}
