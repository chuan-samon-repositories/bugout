import type { ReactNode } from "react";
import { Container, PageHeader } from "@/presentation/components/ui";
import { formatDate, messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { Prose } from "./Prose";

export interface LegalPageProps {
  title: string;
  /** ISO calendar date (YYYY-MM-DD) of the current version. */
  updatedAt: string;
  children: ReactNode;
}

/** Parses YYYY-MM-DD as a local calendar date so the day never shifts with the time zone. */
function toCalendarDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
}

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: messages.common.home, href: routes.home }, { label: title }]}
        description={
          <p className="text-sm">
            {messages.content.updatedAt} <time dateTime={updatedAt}>{formatDate(toCalendarDate(updatedAt))}</time>
          </p>
        }
      />
      <Container className="pt-14 pb-24 sm:pt-16">
        <Prose className="mx-auto">{children}</Prose>
      </Container>
    </>
  );
}
