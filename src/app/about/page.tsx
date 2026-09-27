import type { Metadata } from "next";
import type { ComponentType } from "react";
import { canPromiseReply, ContactChannel } from "@/presentation/components/content";
import {
  ButtonLink,
  CheckCircleIcon,
  ClockIcon,
  Container,
  cn,
  focusRing,
  InfoIcon,
  MailIcon,
  PackageIcon,
  PageHeader,
  ShieldIcon,
  type IconProps,
} from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { pageMetadata } from "@/presentation/seo/pageMetadata";

const copy = messages.content.about;

export const metadata: Metadata = pageMetadata({ title: copy.title, description: copy.description, path: routes.about });

const linkClasses = cn("rounded-sm font-medium text-accent underline underline-offset-2 hover:no-underline", focusRing);
const valueIcons: ComponentType<IconProps>[] = [CheckCircleIcon, InfoIcon, ShieldIcon, MailIcon];
const designIcons: ComponentType<IconProps>[] = [ClockIcon, CheckCircleIcon, PackageIcon];

function IconBadge({ icon: Icon }: { icon: ComponentType<IconProps> }) {
  return (
    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
      <Icon className="size-6" />
    </span>
  );
}

export default function AboutPage() {
  /** A message really reaches the shop (email or connected form): invite people to write and promise a reply. */
  const hasChannel = canPromiseReply();
  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
        breadcrumbs={[{ label: messages.common.home, href: routes.home }, { label: copy.title }]}
      />
      <Container className="py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <section aria-labelledby="about-story" className="min-w-0">
            <h2 id="about-story" className="text-2xl text-navy-deep sm:text-3xl">
              {copy.storyTitle}
            </h2>
            <div className="mt-5 space-y-4 text-base leading-7 text-muted">
              {copy.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="about-mission"
            className="min-w-0 self-start rounded-2xl bg-navy-deep p-6 text-sand sm:p-8"
          >
            <h2 id="about-mission" className="text-2xl font-bold tracking-tight text-orange-on-navy">
              {copy.missionTitle}
            </h2>
            <p className="mt-4 text-lg leading-8">{copy.mission}</p>
          </section>
        </div>

        <section aria-labelledby="about-values" className="mt-16 sm:mt-20">
          <h2 id="about-values" className="text-2xl text-navy-deep sm:text-3xl">
            {copy.valuesTitle}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.values.map((value, index) => (
              <li key={value.title} className="min-w-0 rounded-2xl bg-white p-6 shadow-card">
                <IconBadge icon={valueIcons[index % valueIcons.length]} />
                <h3 className="mt-4 text-lg font-bold text-navy-deep">{value.title}</h3>
                <p className="mt-2 leading-7 text-muted">{value.description}</p>
              </li>
            ))}
            <li className="min-w-0 rounded-2xl bg-white p-6 shadow-card">
              <IconBadge icon={valueIcons[copy.values.length % valueIcons.length]} />
              <h3 className="mt-4 text-lg font-bold text-navy-deep">{copy.supportValue.title}</h3>
              <p className="mt-2 leading-7 text-muted">
                {copy.supportValue.lead} <ContactChannel linkClassName={linkClasses} />
                {hasChannel && ` ${copy.supportValue.replyPromise}`}.
              </p>
            </li>
          </ul>
        </section>

        <section aria-labelledby="about-design" className="mt-16 sm:mt-20">
          <h2 id="about-design" className="text-2xl text-navy-deep sm:text-3xl">
            {copy.designTitle}
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{copy.designIntro}</p>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {copy.designPoints.map((point, index) => (
              <li key={point.title} className="flex min-w-0 gap-4">
                <IconBadge icon={designIcons[index % designIcons.length]} />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-navy-deep">{point.title}</h3>
                  <p className="mt-2 leading-7 text-muted">{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="about-cta"
          className="mt-16 rounded-2xl bg-sand-dim px-6 py-12 text-center sm:mt-20 sm:px-10"
        >
          <h2 id="about-cta" className="text-2xl text-navy-deep sm:text-3xl">
            {copy.ctaTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-muted">{hasChannel ? copy.ctaText : copy.ctaTextWithoutChannel}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={routes.products} size="lg">
              {copy.ctaProducts}
            </ButtonLink>
            {hasChannel && (
              <ButtonLink href={routes.contact} variant="secondary" size="lg">
                {copy.ctaContact}
              </ButtonLink>
            )}
          </div>
        </section>
      </Container>
    </>
  );
}
