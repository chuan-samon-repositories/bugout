import type { Metadata } from "next";
import { ButtonLink, Container, FrogMascot, PageHeader } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { isMascotEnabled } from "@/presentation/config/mascot";
import { routes } from "@/presentation/routes";

const copy = messages.shell.notFound;

export const metadata: Metadata = {
  title: copy.title,
};

export default function NotFound() {
  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <Container className="flex flex-col items-center gap-8 py-14 sm:py-20">
        {isMascotEnabled() && <FrogMascot className="[--frog-size:144px]" />}
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href={routes.home}>{copy.home}</ButtonLink>
          <ButtonLink href={routes.products} variant="secondary">
            {copy.products}
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
