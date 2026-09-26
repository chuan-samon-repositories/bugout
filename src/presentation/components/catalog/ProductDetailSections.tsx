import type { ReactNode } from "react";
import type { Product } from "@/domain/entities/product/Product";
import { CheckIcon } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";

function DetailSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="min-w-0">
      <h2 id={id} className="text-xl font-bold text-ink">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Description, features, specifications and kit contents; each only when the product has that data. */
export function ProductDetailSections({ product }: { product: Product }) {
  const t = messages.catalog.product;
  const details = product.details;
  const description = details?.longDescription ?? product.description;

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {description && (
        <DetailSection id="product-description" title={t.description}>
          <p className="leading-relaxed text-ink">{description}</p>
        </DetailSection>
      )}

      {details && details.features.length > 0 && (
        <DetailSection id="product-features" title={t.features}>
          <ul className="flex flex-col gap-2">
            {details.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-ink">
                <CheckIcon className="mt-0.5 size-5 shrink-0 text-success" />
                <span className="min-w-0">{feature}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {details && details.specifications.length > 0 && (
        <DetailSection id="product-specifications" title={t.specifications}>
          <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {details.specifications.map((spec) => (
              <div key={spec.label} className="min-w-0 border-b border-sand py-3">
                <dt className="text-sm text-muted">{spec.label}</dt>
                <dd className="break-words font-medium text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </DetailSection>
      )}

      {details && details.contents.length > 0 && (
        <DetailSection id="product-contents" title={t.contents}>
          <KitContentsList product={product} />
        </DetailSection>
      )}
    </div>
  );
}

/** The kit's contents as a two-column list (item, quantity). Renders nothing without contents. */
export function KitContentsList({ product }: { product: Product }) {
  const contents = product.details?.contents ?? [];
  if (contents.length === 0) return null;
  return (
    <ul className="divide-y divide-sand rounded-xl border border-sand bg-white">
      {contents.map((entry) => (
        <li key={entry.item} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
          <span className="min-w-0 text-ink">{entry.item}</span>
          <span className="shrink-0 text-sm font-medium text-muted">{entry.quantity}</span>
        </li>
      ))}
    </ul>
  );
}
