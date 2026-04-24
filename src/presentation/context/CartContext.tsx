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
  getCheckoutUrl: () => Promise<string>;
  itemCount: number;
  totalAmount: Money;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const cartUseCase = useMemo(
    () => DependencyContainer.getInstance().getManageCartUseCase(),
    [],
  );

  const checkoutUseCase = useMemo(
    () => DependencyContainer.getInstance().getCreateCheckoutUseCase(),
    [],
  );

  const loadCart = useCallback(async () => {
    const loadedCart = await cartUseCase.getCart();
    setCart(loadedCart);
  }, [cartUseCase]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = useCallback(
    async (productId: ProductId, quantity: Quantity) => {
      setLoading(true);
      try {
        const updatedCart = await cartUseCase.addToCart(productId, quantity);
        setCart(updatedCart);
      } finally {
        setLoading(false);
      }
    },
    [cartUseCase],
  );

  const removeItem = useCallback(
    async (productId: ProductId) => {
      setLoading(true);
      try {
        const updatedCart = await cartUseCase.removeFromCart(productId);
        setCart(updatedCart);
      } finally {
        setLoading(false);
      }
    },
    [cartUseCase],
  );

  const deleteItem = useCallback(
    async (productId: ProductId) => {
      setLoading(true);
      try {
        const updatedCart = await cartUseCase.deleteFromCart(productId);
        setCart(updatedCart);
      } finally {
        setLoading(false);
      }
    },
    [cartUseCase],
  );

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      await cartUseCase.clearCart();
      setCart(new Cart());
    } finally {
      setLoading(false);
    }
  }, [cartUseCase]);

  const getCheckoutUrl = useCallback(async () => {
    setLoading(true);
    try {
      return await checkoutUseCase.execute();
    } finally {
      setLoading(false);
    }
  }, [checkoutUseCase]);

  const itemCount = useMemo(() => cart?.itemCount() ?? 0, [cart]);
  const totalAmount = useMemo(() => cart?.totalAmount() ?? new Money(0), [cart]);

  return (
    <CartContext.Provider value={{ cart, loading, addItem, removeItem, deleteItem, clearCart, getCheckoutUrl, itemCount, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used inside CartProvider");
  return ctx;
}
