import type { Metadata } from "next";
import { ButtonLink, Container, PageHeader } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.shell.notFound;

export const metadata: Metadata = {
  title: copy.title,
};

export default function NotFound() {
  return (
    <Container className="pb-16">
      <PageHeader title={copy.title} description={copy.description} />
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={routes.home}>{copy.home}</ButtonLink>
        <ButtonLink href={routes.products} variant="secondary">
          {copy.products}
        </ButtonLink>
      </div>
    </Container>
  );
}
