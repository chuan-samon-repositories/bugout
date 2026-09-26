"use client";

import type { ReactNode } from "react";
import { AnalyticsProvider } from "@/presentation/context/AnalyticsContext";
import { CartProvider } from "@/presentation/context/CartContext";
import { NotificationProvider } from "@/presentation/context/NotificationContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      <AnalyticsProvider>
        <CartProvider>{children}</CartProvider>
      </AnalyticsProvider>
    </NotificationProvider>
  );
}
