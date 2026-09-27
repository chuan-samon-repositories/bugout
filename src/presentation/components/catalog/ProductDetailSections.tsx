import type { ReactNode } from "react";
import type { Product } from "@/domain/entities/product/Product";
import { CheckIcon } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";

function DetailSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="min-w-0">
      <h2 id={id} className="text-2xl text-navy-deep">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** True when ProductDetailSections has something to show for `product`. */
export function hasDetailSections(product: Product): boolean {
  const details = product.details;
  return !!details && (!!details.longDescription?.trim() || details.features.length > 0 || details.specifications.length > 0);
}

/**
 * Long description, features and specifications; each only when the product has that data.
 * The short description is already under the page title, so "Descripción" needs a long one.
 * Kit contents live in KitContentsList.
 */
export function ProductDetailSections({ product }: { product: Product }) {
  const t = messages.catalog.product;
  const details = product.details;
  const description = details?.longDescription?.trim();

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {description && (
        <DetailSection id="product-description" title={t.description}>
          {/* pre-line: a Shopify long description can contain line breaks. */}
          <p className="leading-relaxed whitespace-pre-line text-ink">{description}</p>
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
              <div key={spec.label} className="min-w-0 border-b border-sand-line py-3">
                <dt className="text-sm text-muted">{spec.label}</dt>
                <dd className="break-words font-bold text-navy-deep">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </DetailSection>
      )}
    </div>
  );
}
