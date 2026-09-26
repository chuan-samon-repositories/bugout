import type { Metadata } from "next";
import { getContainer } from "@/infrastructure/config";
import { ContactFaq } from "@/presentation/components/forms/ContactFaq";
import { ContactForm } from "@/presentation/components/forms/ContactForm";
import { isContactTopic } from "@/presentation/components/forms/contactTopics";
import { ContactHelp } from "@/presentation/components/forms/ContactHelp";
import { Container, PageHeader } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.forms.contact;

export const metadata: Metadata = {
  title: copy.metadata.title,
  description: copy.metadata.description,
};

interface ContactPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { topic } = await searchParams;
  const initialTopic = isContactTopic(topic) ? topic : undefined;
  const policy = getContainer().getPricingPolicy();
  return (
    <Container className="pb-16">
      <PageHeader
        title={copy.title}
        description={copy.intro}
        breadcrumbs={[{ label: messages.common.home, href: routes.home }, { label: copy.title }]}
      />
      <div className="grid gap-10 lg:grid-cols-3">
        <section aria-labelledby="contact-form-title" className="min-w-0 lg:col-span-2">
          <h2 id="contact-form-title" className="mb-6 text-2xl font-bold tracking-tight text-ink">
            {copy.formTitle}
          </h2>
          <ContactForm key={initialTopic ?? "general"} initialTopic={initialTopic} />
        </section>
        <div className="min-w-0">
          <ContactHelp policy={policy} />
        </div>
      </div>
      <div className="mt-16 max-w-3xl">
        <ContactFaq policy={policy} />
      </div>
    </Container>
  );
}
