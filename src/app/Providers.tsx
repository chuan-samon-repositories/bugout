"use client";

import { CartProvider } from "../presentation/context/CartContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
