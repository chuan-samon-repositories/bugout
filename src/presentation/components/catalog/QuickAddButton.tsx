"use client";

import { useMemo, useState } from "react";
import { Button } from "@/presentation/components/ui";
import { useCart } from "@/presentation/context/CartContext";
import { messages } from "@/presentation/i18n";
import { fromProductSnapshot, type ProductSnapshot } from "./productSnapshot";

const copy = messages.catalog.kit;

export interface QuickAddButtonProps {
  product: ProductSnapshot;
  className?: string;
}

/** One-click "Añadir" for product cards (single-variant, in-stock products only). */
export function QuickAddButton({ product: snapshot, className }: QuickAddButtonProps) {
  const product = useMemo(() => fromProductSnapshot(snapshot), [snapshot]);
  const { addItem, pending } = useCart();
  const [adding, setAdding] = useState(false);

  const add = async () => {
    setAdding(true);
    try {
      await addItem(product, 1, "product_card");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => void add()}
      loading={adding}
      disabled={pending && !adding}
      aria-label={copy.quickAddLabel(product.name)}
      className={className}
    >
      {copy.quickAdd}
    </Button>
  );
}
