import type { ContactTopic } from "@/application/dtos/Contact";

export const CONTACT_TOPICS: readonly ContactTopic[] = ["general", "order", "product", "wholesale"];

/** Narrows a raw value (e.g. the `topic` search param) to a ContactTopic. Safe to call from Server Components. */
export function isContactTopic(value: unknown): value is ContactTopic {
  return typeof value === "string" && (CONTACT_TOPICS as readonly string[]).includes(value);
}
