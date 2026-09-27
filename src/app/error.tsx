"use client";

import { useEffect } from "react";
import { Button, ButtonLink, Container, PageHeader } from "@/presentation/components/ui";
import { useAnalytics } from "@/presentation/context/AnalyticsContext";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.shell.error;

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.captureException(error, error.digest ? { digest: error.digest } : undefined);
  }, [analytics, error]);

  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <Container className="flex justify-center py-14 sm:py-20">
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>{copy.retry}</Button>
          <ButtonLink href={routes.home} variant="secondary">
            {copy.home}
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
