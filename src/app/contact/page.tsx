import type { Metadata } from "next";
import { getContainer } from "@/infrastructure/config";
import { canPromiseReply } from "@/presentation/components/content/ContactChannel";
import { ContactFaq } from "@/presentation/components/forms/ContactFaq";
import { ContactForm } from "@/presentation/components/forms/ContactForm";
import { isContactTopic } from "@/presentation/components/forms/contactTopics";
import { ContactHelp } from "@/presentation/components/forms/ContactHelp";
import { Container, PageHeader } from "@/presentation/components/ui";
import { isMessagingEnabled } from "@/presentation/config/messaging";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { pageMetadata } from "@/presentation/seo/pageMetadata";

const copy = messages.forms.contact;

/** `?topic=` only preselects the form, so every contact URL has the same canonical. */
export function generateMetadata(): Metadata {
  return pageMetadata({
    title: copy.metadata.title,
    description: canPromiseReply() ? copy.metadata.description : copy.metadata.descriptionWithoutChannel,
    path: routes.contact,
  });
}

interface ContactPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * With messaging enabled: the contact form (topic preselected from `?topic=`) beside the quick help, then the
 * FAQ. Without it the form is hidden and `?topic=` is ignored: the FAQ takes the main column beside the help.
 */
export default async function ContactPage({ searchParams }: ContactPageProps) {
  const policy = getContainer().getPricingPolicy();
  const header = (
    <PageHeader
      title={copy.title}
      description={canPromiseReply() ? copy.intro : copy.introWithoutChannel}
      breadcrumbs={[{ label: messages.common.home, href: routes.home }, { label: copy.title }]}
    />
  );

  if (!isMessagingEnabled()) {
    return (
      <>
        {header}
        <Container className="grid gap-10 py-16 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <ContactFaq policy={policy} />
          </div>
          <div className="min-w-0">
            <ContactHelp policy={policy} />
          </div>
        </Container>
      </>
    );
  }

  const { topic } = await searchParams;
  const initialTopic = isContactTopic(topic) ? topic : undefined;
  return (
    <>
      {header}
      <Container className="py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <section aria-labelledby="contact-form-title" className="min-w-0 lg:col-span-2">
            <h2 id="contact-form-title" className="mb-6 text-2xl text-navy-deep">
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
    </>
  );
}
