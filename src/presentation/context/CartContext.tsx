"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { Cart } from "../../domain/entities/cart/Cart";
import { ProductId } from "../../domain/value-objects/ProductId";
import { Quantity } from "../../domain/value-objects/Quantity";
import { Money } from "../../domain/value-objects/Money";
import { DependencyContainer } from "../../infrastructure/config/dependencies";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  addItem: (productId: ProductId, quantity: Quantity) => Promise<void>;
  removeItem: (productId: ProductId) => Promise<void>;
  deleteItem: (productId: ProductId) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  totalAmount: Money;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const useCase = useMemo(
    () => DependencyContainer.getInstance().getManageCartUseCase(),
    [],
  );

  const loadCart = useCallback(async () => {
    const loadedCart = await useCase.getCart();
    setCart(loadedCart);
  }, [useCase]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = useCallback(
    async (productId: ProductId, quantity: Quantity) => {
      setLoading(true);
      try {
        const updatedCart = await useCase.addToCart(productId, quantity);
        setCart(updatedCart);
      } finally {
        setLoading(false);
      }
    },
    [useCase],
  );

  const removeItem = useCallback(
    async (productId: ProductId) => {
      setLoading(true);
      try {
        const updatedCart = await useCase.removeFromCart(productId);
        setCart(updatedCart);
      } finally {
        setLoading(false);
      }
    },
    [useCase],
  );

  const deleteItem = useCallback(
    async (productId: ProductId) => {
      setLoading(true);
      try {
        const updatedCart = await useCase.deleteFromCart(productId);
        setCart(updatedCart);
      } finally {
        setLoading(false);
      }
    },
    [useCase],
  );

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      await useCase.clearCart();
      setCart(new Cart());
    } finally {
      setLoading(false);
    }
  }, [useCase]);

  const itemCount = useMemo(() => cart?.itemCount() ?? 0, [cart]);
  const totalAmount = useMemo(() => cart?.totalAmount() ?? new Money(0), [cart]);

  return (
    <CartContext.Provider value={{ cart, loading, addItem, removeItem, deleteItem, clearCart, itemCount, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used inside CartProvider");
  return ctx;
}
