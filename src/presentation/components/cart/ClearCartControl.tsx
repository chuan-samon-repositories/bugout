"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";

const copy = messages.cart;

interface ClearCartControlProps {
  disabled: boolean;
  onConfirm: () => void;
}

/** "Vaciar carrito" with an inline confirmation step instead of window.confirm. */
export function ClearCartControl({ disabled, onConfirm }: ClearCartControlProps) {
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
    else if (wasConfirming.current) triggerRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  if (!confirming) {
    return (
      <Button ref={triggerRef} variant="ghost" size="sm" disabled={disabled} onClick={() => setConfirming(true)}>
        {copy.clear}
      </Button>
    );
  }

  return (
    <div role="group" aria-label={copy.clear} className="flex flex-wrap items-center gap-2 rounded-xl border-[1.5px] border-sand-line p-3">
      <p className="w-full text-sm font-medium text-ink">{copy.clearConfirm}</p>
      <Button
        variant="danger"
        size="sm"
        disabled={disabled}
        onClick={() => {
          wasConfirming.current = false;
          onConfirm();
        }}
      >
        {copy.clearConfirmYes}
      </Button>
      <Button ref={cancelRef} variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        {copy.clearConfirmNo}
      </Button>
    </div>
  );
}
