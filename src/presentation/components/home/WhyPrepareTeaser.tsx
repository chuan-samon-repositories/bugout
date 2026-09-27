import Image from "next/image";
import { ButtonLink, Container, Eyebrow, Reveal, cn } from "@/presentation/components/ui";
import { brandAssets } from "@/presentation/config/brand";
import { isMascotEnabled } from "@/presentation/config/mascot";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.catalog.home;
const frog = brandAssets.frog;

/** Section 5: "Por qué prepararse" teaser on sand-dim, with the frog when the mascot is enabled. */
export function WhyPrepareTeaser() {
  const showFrog = isMascotEnabled();
  return (
    <section aria-labelledby="why-title" className="bg-sand-dim py-20 sm:py-28">
      <Container
        className={cn(
          "text-center",
          showFrog ? "grid items-center gap-14 md:grid-cols-[1.3fr_0.7fr] md:text-left" : "max-w-[47.5rem]",
        )}
      >
        <Reveal>
          <Eyebrow>{copy.whyEyebrow}</Eyebrow>
          <h2 id="why-title" className="mb-5 text-[clamp(1.75rem,3.6vw,2.5rem)] leading-tight text-navy-deep">
            {copy.whyTitle}
          </h2>
          {copy.whyParagraphs.map((paragraph) => (
            <p key={paragraph} className="mb-4 leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
          <ButtonLink href={routes.whyPrepare} variant="secondary" className="mt-3">
            {copy.whyMore}
          </ButtonLink>
        </Reveal>
        {showFrog && (
          <Image
            src={frog.src}
            width={frog.width}
            height={frog.height}
            alt=""
            className="mx-auto hidden h-auto w-full max-w-60 [image-rendering:pixelated] md:block"
          />
        )}
      </Container>
    </section>
  );
}
