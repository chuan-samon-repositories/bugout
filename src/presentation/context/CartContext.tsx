"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AnalyticsEvent } from "@/application/analytics/events";
import type { Cart } from "@/domain/entities/cart/Cart";
import type { Product } from "@/domain/entities/product/Product";
import { BusinessRuleError, NotFoundError } from "@/domain/errors";
import type { Money } from "@/domain/value-objects/Money";
import { ProductId } from "@/domain/value-objects/ProductId";
import { Quantity } from "@/domain/value-objects/Quantity";
import { getContainer } from "@/infrastructure/config";
import { messages, toUserMessage } from "@/presentation/i18n";
import { useAnalytics } from "./AnalyticsContext";
import { useNotifications } from "./NotificationContext";

export type AddToCartSource = "product_page" | "cart_drawer";

export interface CartContextValue {
  /** Null until the stored cart has been restored on the client. */
  cart: Cart | null;
  ready: boolean;
  /** A cart mutation (or checkout) is in flight. */
  pending: boolean;
  itemCount: number;
  subtotal: Money | null;
  isOpen: boolean;
  openCart(): void;
  closeCart(): void;
  /** Resolves true on success; shows a toast and opens the drawer, or shows an error toast. */
  addItem(product: Product, quantity: number, source?: AddToCartSource): Promise<boolean>;
  setItemQuantity(productId: string, quantity: number): Promise<void>;
  /** Removes the whole line. */
  removeItem(productId: string): Promise<void>;
  clearCart(): Promise<void>;
  checkout(): Promise<void>;
  /** Reloads the cart from the repository (e.g. after an order is placed). */
  refresh(): Promise<void>;
}

type FailureReason = Extract<AnalyticsEvent, { name: "add_to_cart_failed" }>["properties"]["reason"];

const STORAGE_KEY_PREFIX = "bugout.";

const CartContext = createContext<CartContextValue | null>(null);

function cartProperties(cart: Cart) {
  return { cart_value: cart.totalAmount().amount, cart_item_count: cart.itemCount(), currency: cart.currency };
}

function productProperties(product: Product) {
  return {
    product_id: product.id.value,
    product_slug: product.slug,
    product_name: product.name,
    category: product.category,
    price: product.price.amount,
    currency: product.price.currency,
  };
}

function failureReason(error: unknown): FailureReason {
  if (error instanceof BusinessRuleError) {
    if (error.code === "OUT_OF_STOCK") return "out_of_stock";
    if (error.code === "MAX_QUANTITY_EXCEEDED") return "max_quantity";
  }
  if (error instanceof NotFoundError) return "not_found";
  return "unknown";
}

function findLine(cart: Cart | null, productId: string) {
  return cart?.getItems().find((item) => item.product.id.value === productId);
}

function isExpectedError(error: unknown): boolean {
  return error instanceof BusinessRuleError || error instanceof NotFoundError;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const analytics = useAnalytics();
  const { notify } = useNotifications();
  const [{ manageCart, createCheckout }] = useState(() => {
    const container = getContainer();
    return { manageCart: container.getManageCartUseCase(), createCheckout: container.getCreateCheckoutUseCase() };
  });

  const [cart, setCartState] = useState<Cart | null>(null);
  const [ready, setReady] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const cartRef = useRef<Cart | null>(null);
  const isOpenRef = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const setCart = useCallback((next: Cart) => {
    cartRef.current = next;
    setCartState(next);
  }, []);

  /** Runs tasks one after another so rapid clicks can never interleave repository reads and writes. */
  const enqueue = useCallback(<T,>(task: () => Promise<T>, mutation: boolean): Promise<T> => {
    if (mutation) setPendingCount((count) => count + 1);
    const run = queue.current.then(task, task);
    queue.current = run.catch(() => undefined);
    if (!mutation) return run;
    return run.finally(() => setPendingCount((count) => count - 1));
  }, []);

  const load = useCallback(async () => {
    try {
      setCart(await manageCart.getCart());
    } catch (error) {
      analytics.captureException(error, { area: "cart", action: "load" });
    } finally {
      setReady(true);
    }
  }, [manageCart, analytics, setCart]);

  const refresh = useCallback(() => enqueue(load, false), [enqueue, load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith(STORAGE_KEY_PREFIX)) void refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const openWith = useCallback(
    (current: Cart | null) => {
      if (!isOpenRef.current && current) analytics.track({ name: "cart_viewed", properties: cartProperties(current) });
      isOpenRef.current = true;
      setIsOpen(true);
    },
    [analytics],
  );

  const openCart = useCallback(() => openWith(cartRef.current), [openWith]);
  const closeCart = useCallback(() => {
    isOpenRef.current = false;
    setIsOpen(false);
  }, []);

  const reportFailure = useCallback(
    (error: unknown, context: { productName?: string; action: string }) => {
      notify({ tone: "error", message: toUserMessage(error, { productName: context.productName }) });
      if (!isExpectedError(error)) analytics.captureException(error, { area: "cart", action: context.action });
    },
    [notify, analytics],
  );

  const addItem = useCallback(
    (product: Product, quantity: number, source: AddToCartSource = "product_page") =>
      enqueue(async () => {
        try {
          const updated = await manageCart.addToCart(product.id, new Quantity(quantity));
          setCart(updated);
          openWith(updated);
          notify({
            tone: "success",
            title: messages.cart.added,
            message: product.name,
          });
          analytics.track({
            name: "product_added_to_cart",
            properties: { ...productProperties(product), ...cartProperties(updated), quantity, source },
          });
          return true;
        } catch (error) {
          const reason = failureReason(error);
          notify({ tone: "error", message: toUserMessage(error, { productName: product.name }) });
          analytics.track({
            name: "add_to_cart_failed",
            properties: { product_id: product.id.value, quantity, reason },
          });
          if (reason === "unknown") analytics.captureException(error, { area: "cart", action: "add" });
          return false;
        }
      }, true),
    [enqueue, manageCart, setCart, openWith, notify, analytics],
  );

  /** After a failed change the stored cart may differ from what is shown (e.g. edited in another tab). */
  const recover = useCallback(async () => {
    try {
      setCart(await manageCart.getCart());
    } catch {
      // Keep showing the last known cart.
    }
  }, [manageCart, setCart]);

  const setItemQuantity = useCallback(
    (productId: string, quantity: number) =>
      enqueue(async () => {
        const line = findLine(cartRef.current, productId);
        try {
          const updated = await manageCart.setQuantity(new ProductId(productId), new Quantity(quantity));
          setCart(updated);
          if (!line) return;
          const delta = quantity - line.quantity.value;
          const properties = { ...productProperties(line.product), ...cartProperties(updated), quantity: Math.abs(delta) };
          if (delta > 0) {
            analytics.track({ name: "product_added_to_cart", properties: { ...properties, source: "cart_drawer" } });
          } else if (delta < 0) {
            analytics.track({ name: "product_removed_from_cart", properties });
          }
        } catch (error) {
          reportFailure(error, { productName: line?.product.name, action: "set_quantity" });
          await recover();
        }
      }, true),
    [enqueue, manageCart, setCart, analytics, reportFailure, recover],
  );

  const removeItem = useCallback(
    (productId: string) =>
      enqueue(async () => {
        const line = findLine(cartRef.current, productId);
        try {
          const updated = await manageCart.deleteFromCart(new ProductId(productId));
          setCart(updated);
          if (line) {
            analytics.track({
              name: "product_removed_from_cart",
              properties: { ...productProperties(line.product), ...cartProperties(updated), quantity: line.quantity.value },
            });
          }
        } catch (error) {
          reportFailure(error, { productName: line?.product.name, action: "remove" });
          await recover();
        }
      }, true),
    [enqueue, manageCart, setCart, analytics, reportFailure, recover],
  );

  const clearCart = useCallback(
    () =>
      enqueue(async () => {
        try {
          setCart(await manageCart.clearCart());
        } catch (error) {
          reportFailure(error, { action: "clear" });
          await recover();
        }
      }, true),
    [enqueue, manageCart, setCart, reportFailure, recover],
  );

  const checkout = useCallback(
    () =>
      enqueue(async () => {
        const current = cartRef.current;
        if (!current || current.isEmpty()) return;
        try {
          const session = await createCheckout.execute();
          analytics.track({
            name: "checkout_started",
            properties: { ...cartProperties(current), checkout_type: session.type },
          });
          closeCart();
          if (session.type === "hosted") {
            window.location.assign(session.url);
          } else {
            router.push(session.url);
          }
        } catch (error) {
          notify({ tone: "error", message: messages.errors.checkoutUnavailable });
          analytics.captureException(error, { area: "cart", action: "checkout" });
        }
      }, true),
    [enqueue, createCheckout, analytics, closeCart, router, notify],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      ready,
      pending: pendingCount > 0,
      itemCount: cart?.itemCount() ?? 0,
      subtotal: ready && cart ? cart.totalAmount() : null,
      isOpen,
      openCart,
      closeCart,
      addItem,
      setItemQuantity,
      removeItem,
      clearCart,
      checkout,
      refresh,
    }),
    [cart, ready, pendingCount, isOpen, openCart, closeCart, addItem, setItemQuantity, removeItem, clearCart, checkout, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a <CartProvider>.");
  }
  return context;
}
