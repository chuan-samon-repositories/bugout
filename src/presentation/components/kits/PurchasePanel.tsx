"use client";

import { useMemo, useState } from "react";
import { AddToCart } from "@/presentation/components/catalog/AddToCart";
import { variantSelectedProperties } from "@/presentation/components/catalog/productAnalytics";
import { fromProductSnapshot, toProductSnapshot, type ProductSnapshot } from "@/presentation/components/catalog/productSnapshot";
import { AlertCircleIcon, CheckCircleIcon, PriceTag, cn } from "@/presentation/components/ui";
import { useAnalytics } from "@/presentation/context/AnalyticsContext";
import { formatMoney, messages } from "@/presentation/i18n";
import { VariantSelector } from "./VariantSelector";

export interface PurchasePanelProps {
  product: ProductSnapshot;
  /** Shows "Desde" before the price (build-your-own kits). */
  fromLabel?: boolean;
  /** Shows the spec table (weight, dimensions...). Kits only: other products list their specs below the fold. */
  showSpecs?: boolean;
}

/**
 * Price, variant chips, stock, quantity + "Añadir al carrito" and the spec table.
 * Picking another variant updates the price (announced politely), stock and cart line.
 * The specs are the product's, not the variant's: for a kit sold in several sizes they
 * describe its first (1-person) version, and the table caption says so.
 */
export function PurchasePanel({ product: snapshot, fromLabel = false, showSpecs = true }: PurchasePanelProps) {
  const analytics = useAnalytics();
  const base = useMemo(() => fromProductSnapshot(snapshot), [snapshot]);
  const [selectedId, setSelectedId] = useState(base.id.value);
  const product = useMemo(() => base.withVariant(selectedId), [base, selectedId]);
  const selectedSnapshot = useMemo(() => toProductSnapshot(product), [product]);
  const t = messages.catalog.product;
  const k = messages.catalog.kit;
  const savings = product.savings();
  const specs = product.details?.specifications ?? [];
  const sized = base.hasVariants();
  const specsVariant = sized ? base.variants[0].title : null;
  const rows = [
    // A single sellable version can name itself; several share the first version's specs (see the caption).
    ...(!sized && product.variantTitle ? [{ label: k.specsFor, value: product.variantTitle }] : []),
    ...specs,
  ];

  const selectVariant = (variantId: string) => {
    if (variantId === selectedId) return;
    setSelectedId(variantId);
    analytics.track({ name: "product_variant_selected", properties: variantSelectedProperties(base.withVariant(variantId)) });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Polite and atomic: a variant change reads out the new price once; nothing is read on load. */}
      <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          {fromLabel && <span className="text-lg font-bold text-muted">{k.from}</span>}
          <PriceTag price={product.price} originalPrice={product.originalPrice} size="lg" />
        </div>
        {savings && <p className="text-sm font-bold text-success">{t.savings(formatMoney(savings))}</p>}
      </div>

      {base.hasVariants() && (
        <VariantSelector variants={base.variants} selectedId={product.id.value} onChange={selectVariant} />
      )}

      {product.inStock ? (
        <p className="flex items-center gap-2 font-semibold text-success">
          <CheckCircleIcon className="size-5 shrink-0" />
          {t.inStock}
        </p>
      ) : (
        <p className="flex items-center gap-2 font-semibold text-danger">
          <AlertCircleIcon className="size-5 shrink-0" />
          {t.outOfStock}
        </p>
      )}

      <AddToCart product={selectedSnapshot} />

      {showSpecs && rows.length > 0 && (
        <table className="w-full text-sm">
          <caption className={cn("caption-bottom", specsVariant ? "pt-2.5 text-left text-xs text-muted" : "sr-only")}>
            {specsVariant ? k.specsForVariant(specsVariant) : k.specs}
          </caption>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-sand-line">
                <th scope="row" className="w-[45%] py-2.5 pr-4 text-left align-top font-semibold text-muted">
                  {row.label}
                </th>
                <td className="py-2.5 font-bold text-navy-deep">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
