import { useState, useEffect, useCallback, useMemo } from "react";
import { Cart } from "../../domain/entities/cart/Cart";
import { ProductId } from "../../domain/value-objects/ProductId";
import { Quantity } from "../../domain/value-objects/Quantity";
import { Money } from "../../domain/value-objects/Money";
import { DependencyContainer } from "../../infrastructure/config/dependencies";

/**
 * React hook for managing shopping cart operations.
 * Uses ManageCartUseCase through dependency injection.
 *
 * @returns Object containing cart state, loading state, and cart operation functions
 *
 * Requirements: 5.4, 5.6, 7.1
 */
export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  // Get useCase instance once using useMemo to prevent recreating on every render
  const useCase = useMemo(() => {
    return DependencyContainer.getInstance().getManageCartUseCase();
  }, []);

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

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      await useCase.clearCart();
      setCart(new Cart());
    } finally {
      setLoading(false);
    }
  }, [useCase]);

  const itemCount = useMemo(() => cart?.itemCount() || 0, [cart]);
  const totalAmount = useMemo(
    () => cart?.totalAmount() || new Money(0),
    [cart],
  );

  return {
    cart,
    loading,
    addItem,
    removeItem,
    clearCart,
    itemCount,
    totalAmount,
  };
}
