"use client";

import { useMemo, useState } from "react";
import { AddToCart } from "@/presentation/components/catalog/AddToCart";
import { fromProductSnapshot, toProductSnapshot, type ProductSnapshot } from "@/presentation/components/catalog/productSnapshot";
import { AlertCircleIcon, CheckCircleIcon, PriceTag } from "@/presentation/components/ui";
import { formatMoney, messages } from "@/presentation/i18n";
import { VariantSelector } from "./VariantSelector";

export interface PurchasePanelProps {
  product: ProductSnapshot;
  /** Shows "Desde" before the price (build-your-own kits). */
  fromLabel?: boolean;
  /** Shows the spec table ("Para", weight, dimensions...). */
  showSpecs?: boolean;
}

/**
 * Price, variant chips, stock, quantity + "Añadir al carrito" and the spec table of the
 * selected variant. Picking another variant updates the price, stock and cart line.
 */
export function PurchasePanel({ product: snapshot, fromLabel = false, showSpecs = true }: PurchasePanelProps) {
  const base = useMemo(() => fromProductSnapshot(snapshot), [snapshot]);
  const [selectedId, setSelectedId] = useState(base.id.value);
  const product = useMemo(() => base.withVariant(selectedId), [base, selectedId]);
  const selectedSnapshot = useMemo(() => toProductSnapshot(product), [product]);
  const t = messages.catalog.product;
  const savings = product.savings();
  const specs = product.details?.specifications ?? [];
  const rows = [
    ...(product.variantTitle ? [{ label: messages.catalog.kit.specsFor, value: product.variantTitle }] : []),
    ...specs,
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          {fromLabel && <span className="text-lg font-bold text-muted">{messages.catalog.kit.from}</span>}
          <PriceTag price={product.price} originalPrice={product.originalPrice} size="lg" />
        </div>
        {savings && <p className="text-sm font-bold text-success">{t.savings(formatMoney(savings))}</p>}
      </div>

      {base.hasVariants() && (
        <VariantSelector variants={base.variants} selectedId={product.id.value} onChange={setSelectedId} />
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
          <caption className="sr-only">{messages.catalog.kit.specs}</caption>
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
