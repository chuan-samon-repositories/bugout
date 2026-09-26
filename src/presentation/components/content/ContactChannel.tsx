import Link from "next/link";
import type { ContactTopic } from "@/application/dtos/Contact";
import { isMessagingEnabled } from "@/presentation/config/messaging";
import { siteConfig } from "@/presentation/config/site";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.content.contactChannel;

export interface ContactChannelState {
  /** The shop's configured contact email, or null. */
  email: string | null;
  /** The contact form is connected to a real backend and shown on the contact page (`isMessagingEnabled()`). */
  messagingEnabled: boolean;
}

/** Where customer messages go right now. */
export function contactChannelState(): ContactChannelState {
  return { email: siteConfig.contactEmail, messagingEnabled: isMessagingEnabled() };
}

/**
 * True when a customer message really reaches someone: an email is configured or the contact form is
 * connected. Otherwise there is no channel, and copy must neither invite people to write nor promise a reply.
 */
export function canPromiseReply(state: ContactChannelState = contactChannelState()): boolean {
  return state.email !== null || state.messagingEnabled;
}

export interface ContactChannelProps {
  /** Contact-form topic to preselect (and name) when the form is the channel. */
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
 * The one way legal and help copy tells customers how to reach the shop. Renders inline text without final
 * punctuation, so it fits inside a sentence:
 * - an email is configured: "escríbenos a <email>";
 * - otherwise, with the contact form connected: "escríbenos a través del formulario de contacto (con el tema «…»)";
 * - otherwise (no channel yet): "visita nuestra página de contacto", which never mentions a form that isn't there.
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
  if (!isMessagingEnabled()) {
    return (
      <>
        {lead(copy.visitPage)} <Link href={routes.contact} className={linkClassName}>
          {copy.pageLink}
        </Link>
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
