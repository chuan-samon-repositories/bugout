import { NewsletterForm } from "@/presentation/components/forms/NewsletterForm";
import { Container, MailIcon } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";

export function NewsletterSection() {
  const t = messages.catalog.home;
  return (
    <section aria-labelledby="newsletter-title" className="bg-navy py-16 text-sand sm:py-20">
      <Container className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="min-w-0">
          <MailIcon className="size-8 text-orange-on-navy" />
          <h2 id="newsletter-title" className="mt-4 text-3xl">
            {t.newsletterTitle}
          </h2>
          <p className="mt-3 text-lg text-sand/85">{t.newsletterText}</p>
        </div>
        <div className="min-w-0">
          <NewsletterForm location="home" tone="dark" />
        </div>
      </Container>
    </section>
  );
}
