import type { Metadata } from "next";
import type { ComponentType } from "react";
import {
  ButtonLink,
  CheckCircleIcon,
  ClockIcon,
  Container,
  InfoIcon,
  MailIcon,
  PackageIcon,
  PageHeader,
  ShieldIcon,
  type IconProps,
} from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.content.about;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
};

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
  return (
    <Container className="pb-16 sm:pb-20">
      <PageHeader
        title={copy.title}
        description={copy.description}
        breadcrumbs={[{ label: messages.common.home, href: routes.home }, { label: copy.title }]}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <section aria-labelledby="about-story" className="min-w-0">
          <h2 id="about-story" className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
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
          className="min-w-0 self-start rounded-2xl bg-navy p-6 text-white sm:p-8"
        >
          <h2 id="about-mission" className="text-2xl font-bold tracking-tight text-orange-on-navy">
            {copy.missionTitle}
          </h2>
          <p className="mt-4 text-lg leading-8">{copy.mission}</p>
        </section>
      </div>

      <section aria-labelledby="about-values" className="mt-16 sm:mt-20">
        <h2 id="about-values" className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {copy.valuesTitle}
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {copy.values.map((value, index) => (
            <li key={value.title} className="min-w-0 rounded-xl border border-sand p-6">
              <IconBadge icon={valueIcons[index % valueIcons.length]} />
              <h3 className="mt-4 text-lg font-semibold text-ink">{value.title}</h3>
              <p className="mt-2 leading-7 text-muted">{value.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-design" className="mt-16 sm:mt-20">
        <h2 id="about-design" className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {copy.designTitle}
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{copy.designIntro}</p>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {copy.designPoints.map((point, index) => (
            <li key={point.title} className="flex min-w-0 gap-4">
              <IconBadge icon={designIcons[index % designIcons.length]} />
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-ink">{point.title}</h3>
                <p className="mt-2 leading-7 text-muted">{point.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="about-cta"
        className="mt-16 rounded-2xl bg-sand px-6 py-10 text-center sm:mt-20 sm:px-10"
      >
        <h2 id="about-cta" className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {copy.ctaTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-ink">{copy.ctaText}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={routes.products} size="lg">
            {copy.ctaProducts}
          </ButtonLink>
          <ButtonLink href={routes.contact} variant="secondary" size="lg">
            {copy.ctaContact}
          </ButtonLink>
        </div>
      </section>
    </Container>
  );
}
