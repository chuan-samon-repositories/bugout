"use client";

import { useMemo, useState } from "react";
import { AddToCart } from "@/presentation/components/catalog/AddToCart";
import { variantSelectedProperties } from "@/presentation/components/catalog/productAnalytics";
import { fromProductSnapshot, toProductSnapshot, type ProductSnapshot } from "@/presentation/components/catalog/productSnapshot";
import { AlertCircleIcon, CheckCircleIcon, PriceTag } from "@/presentation/components/ui";
import { useAnalytics } from "@/presentation/context/AnalyticsContext";
import { formatMoney, messages } from "@/presentation/i18n";
import { KitSpecsTable } from "./KitSpecsTable";
import { VariantSelector } from "./VariantSelector";

export interface PurchasePanelProps {
  product: ProductSnapshot;
  /** Shows the spec table (weight, dimensions...). Kits only: other products list their specs below the fold. */
  showSpecs?: boolean;
}

/**
 * Price, variant chips, stock, quantity + "Añadir al carrito" and the spec table.
 * Picking another variant updates the price (announced politely), stock and cart line.
 * The specs are the product's, not the variant's: for a kit sold in several sizes they
 * describe its first (1-person) version, and the table caption says so.
 */
export function PurchasePanel({ product: snapshot, showSpecs = true }: PurchasePanelProps) {
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
        <PriceTag price={product.price} originalPrice={product.originalPrice} size="lg" />
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

      {showSpecs && <KitSpecsTable rows={rows} variantCaption={specsVariant} />}
    </div>
  );
}
