import Link from "next/link";
import { variantOptionLabel } from "@/application/catalog";
import type { Product } from "@/domain/entities/product/Product";
import { buttonClasses, cn } from "@/presentation/components/ui";
import { startingPriceLabel } from "@/presentation/components/catalog/startingPrice";
import { KitPhotoSwing } from "@/presentation/components/kits/KitPhotoSwing";
import { kitCardPhoto, kitPhotoVars, tallestKitPhoto } from "@/presentation/components/kits/kitCardPhotos";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";

const copy = messages.catalog.kit;

/** Header gradients cycled across kit cards, as in the partner design (navy, orange, deep navy). */
const MEDIA_TONES = [
  "from-navy to-navy-deep",
  "from-orange to-orange-deep",
  "from-navy-deep to-navy-darker",
] as const;

/** People options of a kit, e.g. "1, 2 o 4"; null for a single-variant kit. */
export function peopleSummary(kit: Product): string | null {
  if (!kit.hasVariants()) return null;
  return copy.peopleList(kit.variants.map(variantOptionLabel));
}

export interface KitCardProps {
  kit: Product;
  /** Position in the grid, used to pick the header gradient. */
  index: number;
  headingLevel?: 2 | 3;
}

/**
 * The partner design's kit card: header with the kit label, facts, price and "Ver el kit". The header is a
 * gradient, or, when the kit has one, a photo of its backpack on white that sticks out above the card and
 * swings ±12° (`KitPhotoSwing`).
 */
export function KitCard({ kit, index, headingLevel = 3 }: KitCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const people = peopleSummary(kit);
  const weight = kit.details?.specifications.find((spec) => /^peso$/i.test(spec.label));
  const photo = kitCardPhoto(kit.slug);

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-kit bg-white shadow-card",
        // the gradient header needs the rounded corners; a photo is let out of the card, and sized by its width
        photo ? "@container" : "overflow-hidden",
        "transition-[transform,box-shadow] duration-350 ease-brand motion-safe:hover:-translate-y-2 hover:shadow-lift",
      )}
      style={photo ? kitPhotoVars(photo) : undefined}
    >
      <div
        className={cn(
          "relative flex h-40 items-start justify-end p-4",
          !photo && "bg-linear-135",
          !photo &&
            "after:absolute after:inset-0 after:bg-[repeating-linear-gradient(115deg,rgb(255_255_255/0.05)_0_2px,transparent_2px_40px)]",
          !photo && MEDIA_TONES[index % MEDIA_TONES.length],
        )}
        data-media={photo ? "photo" : "gradient"}
      >
        {photo && (
          <>
            <span
              aria-hidden="true"
              className="absolute bottom-2.5 left-1/2 h-3.5 w-2/5 -translate-x-1/2 rounded-[50%] bg-navy-deep/20 blur-sm"
            />
            {/* bottom-3 matches KIT_PHOTO_BASE (148 px down the 160 px header). The box reaches into the gaps
                beside the card so the swing has room; the photo itself stays within the card's width. */}
            <div className="pointer-events-none absolute -inset-x-3.5 bottom-3 h-[min(var(--kit-photo-max),calc(var(--kit-photo-ratio)*100cqw))]">
              <KitPhotoSwing image={photo.image} />
            </div>
          </>
        )}
        {kit.details?.kit && (
          <span className="relative z-10 rounded-full bg-navy-deep/85 px-3.5 py-1.5 text-xs font-extrabold tracking-[0.08em] text-sand">
            {kit.details.kit.label}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6 pb-7">
        <Heading className="mb-2 text-[1.3125rem] text-navy-deep">{kit.name}</Heading>
        <p className="mb-4 text-sm text-muted">{kit.description}</p>
        <ul className="mb-5 flex-1 space-y-1 text-[0.8125rem] text-muted">
          {people && <li>{copy.fact(copy.people, people)}</li>}
          {weight && <li>{copy.fact(weight.label, weight.value)}</li>}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xl font-extrabold text-navy-deep">{startingPriceLabel(kit)}</p>
          <Link href={routes.product(kit.slug)} aria-label={copy.viewLabel(kit.name)} className={buttonClasses({ size: "sm" })}>
            {copy.view}
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Room for photos that stick out above their card: how far the photo rises past the card top, from the card's
 * width. Stacked (one column), each photo card leaves its own room above it; in rows, the grid leaves the tallest
 * photo's room above the first row. The column widths subtract the 1.75rem gaps (gap-7). `cqw` is the grid's width.
 */
const ROOM_ABOVE_STACKED_CARD =
  "mt-[max(0px,calc(min(var(--kit-photo-max),calc(var(--kit-photo-ratio)*100cqw))_-_var(--kit-photo-base)))] md:mt-0";
const ROOM_ABOVE_ROW =
  "md:pt-[max(0px,calc(min(var(--kit-photo-max),calc(var(--kit-photo-ratio)*(100cqw_-_1.75rem)/2))_-_var(--kit-photo-base)))] " +
  "lg:pt-[max(0px,calc(min(var(--kit-photo-max),calc(var(--kit-photo-ratio)*(100cqw_-_3.5rem)/3))_-_var(--kit-photo-base)))]";

export function KitCardGrid({ kits, headingLevel }: { kits: readonly Product[]; headingLevel?: 2 | 3 }) {
  const tallest = tallestKitPhoto(kits.map((kit) => kit.slug));
  return (
    <div className="@container">
      <ul
        className={cn("grid gap-7 md:grid-cols-2 lg:grid-cols-3", tallest && ROOM_ABOVE_ROW)}
        style={tallest ? kitPhotoVars(tallest) : undefined}
      >
        {kits.map((kit, index) => {
          const photo = kitCardPhoto(kit.slug);
          return (
            <li
              key={kit.slug}
              className={cn("min-w-0", photo && ROOM_ABOVE_STACKED_CARD)}
              style={photo ? kitPhotoVars(photo) : undefined}
            >
              <KitCard kit={kit} index={index} headingLevel={headingLevel} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
