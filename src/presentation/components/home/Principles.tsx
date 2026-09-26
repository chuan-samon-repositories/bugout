import type { ComponentType } from "react";
import { CheckCircleIcon, Container, PackageIcon, ShieldIcon, type IconProps } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";

const ICONS: ComponentType<IconProps>[] = [ShieldIcon, CheckCircleIcon, PackageIcon];

export function Principles() {
  const t = messages.catalog.home;
  return (
    <section aria-labelledby="principles-title" className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="principles-title" className="text-3xl font-bold tracking-tight text-ink">
            {t.principlesTitle}
          </h2>
          <p className="mt-3 text-lg text-muted">{t.principlesIntro}</p>
        </div>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {t.principles.map((principle, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <li key={principle.title} className="rounded-xl border border-sand bg-white p-6">
                <Icon className="size-8 text-navy" />
                <h3 className="mt-4 text-xl font-semibold text-ink">{principle.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{principle.text}</p>
              </li>
            );
          })}
        </ul>
        <div className="mx-auto mt-12 max-w-2xl rounded-2xl bg-navy-deep p-8 text-center text-white">
          <h3 className="text-2xl font-bold">{t.missionTitle}</h3>
          <p className="mt-3 leading-relaxed text-white/90">{t.missionText}</p>
        </div>
      </Container>
    </section>
  );
}
