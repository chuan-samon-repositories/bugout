"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AnalyticsEvent } from "@/application/analytics/events";
import type { CartNotice, CartUpdate } from "@/application/dtos/Cart";
import type { Cart } from "@/domain/entities/cart/Cart";
import type { Product } from "@/domain/entities/product/Product";
import { BusinessRuleError, NotFoundError, ValidationError } from "@/domain/errors";
import type { Money } from "@/domain/value-objects/Money";
import { ProductId } from "@/domain/value-objects/ProductId";
import { Quantity } from "@/domain/value-objects/Quantity";
import { getContainer } from "@/infrastructure/config";
import { messages, toUserMessage } from "@/presentation/i18n";
import { useAnalytics } from "./AnalyticsContext";
import { useNotifications } from "./NotificationContext";

export type AddToCartSource = "product_page" | "product_card" | "cart_drawer";

export interface CheckoutOptions {
  /** Replace the current history entry when handing off to a hosted checkout. Default false. */
  replace?: boolean;
}

export interface CartContextValue {
  /** Null until the stored cart has been restored on the client. */
  cart: Cart | null;
  ready: boolean;
  /** True when the last load of the stored cart failed; `refresh()` retries. */
  loadError: boolean;
  /** A cart mutation (or checkout) is in flight. */
  pending: boolean;
  itemCount: number;
  subtotal: Money | null;
  isOpen: boolean;
  /** Opens the drawer at the visitor's request (tracks cart_viewed). */
  openCart(): void;
  closeCart(): void;
  /**
   * Resolves true on success and opens the drawer (a labelled dialog that receives focus, so it is the
   * confirmation; no success toast that could cover its buttons), or shows an error toast.
   */
  addItem(product: Product, quantity: number, source?: AddToCartSource): Promise<boolean>;
  setItemQuantity(productId: string, quantity: number): Promise<void>;
  /** Removes the whole line. */
  removeItem(productId: string): Promise<void>;
  clearCart(): Promise<void>;
  /**
   * Resolves true once navigation to the checkout has started, false if it could not start. A hosted checkout
   * is opened with `location.assign` by default; `replace: true` uses `location.replace` so the page that
   * started it (e.g. /checkout) is not left in the history to bounce Back into the provider again.
   */
  checkout(options?: CheckoutOptions): Promise<boolean>;
  /** Reloads the cart from the repository (e.g. after an order is placed). */
  refresh(): Promise<void>;
  /**
   * Runs `task` inside the cart mutation queue (so `pending` is true and the drawer controls are disabled
   * meanwhile), then reloads the cart. Resolves or rejects with the task's own result.
   */
  runExclusive<T>(task: () => Promise<T>): Promise<T>;
}

type FailureReason = Extract<AnalyticsEvent, { name: "add_to_cart_failed" }>["properties"]["reason"];

const CartContext = createContext<CartContextValue | null>(null);

function cartProperties(cart: Cart) {
  return { cart_value: cart.totalAmount().amount, cart_item_count: cart.itemCount(), currency: cart.currency };
}

function productProperties(product: Product) {
  return {
    product_id: product.id.value,
    product_slug: product.slug,
    product_name: product.name,
    variant_title: product.variantTitle,
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

/** Copy for a change the store made to the cart on its own (not enough stock, sold out). */
function noticeMessage(notice: CartNotice): string {
  return notice.kind === "quantityReduced"
    ? messages.cart.quantityReduced(notice.productName, notice.quantity)
    : messages.cart.lineRemoved(notice.productName);
}

function cartAdjustedEvent(notice: CartNotice): Extract<AnalyticsEvent, { name: "cart_adjusted" }> {
  return {
    name: "cart_adjusted",
    properties:
      notice.kind === "quantityReduced"
        ? {
            product_id: notice.productId,
            product_name: notice.productName,
            reason: "quantity_reduced",
            quantity_requested: notice.requested,
            quantity_kept: notice.quantity,
          }
        : {
            product_id: notice.productId,
            product_name: notice.productName,
            reason: "removed",
            quantity_requested: null,
            quantity_kept: 0,
          },
  };
}

/** Units of `quantity` the store really added, given its notices (it may have had less stock). */
function unitsAdded(productId: string, quantity: number, notices: readonly CartNotice[]): number {
  const notice = notices.find((candidate) => candidate.productId === productId);
  if (!notice) return quantity;
  if (notice.kind === "removed") return 0;
  return Math.max(0, quantity - (notice.requested - notice.quantity));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const analytics = useAnalytics();
  const { notify } = useNotifications();
  const [{ manageCart, createCheckout, consentRepository, cartStorageKeys }] = useState(() => {
    const container = getContainer();
    return {
      manageCart: container.getManageCartUseCase(),
      createCheckout: container.getCreateCheckoutUseCase(),
      /** Read when checkout starts, so the hosted checkout gets the visitor's current decision. */
      consentRepository: container.getConsentRepository(),
      /** Storage keys that hold the cart; other tabs changing them (or clearing storage) trigger a reload. */
      cartStorageKeys: container.getSyncedStorageKeys().cart,
    };
  });

  const [cart, setCartState] = useState<Cart | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const cartRef = useRef<Cart | null>(null);
  const isOpenRef = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const setCart = useCallback((next: Cart) => {
    cartRef.current = next;
    setCartState(next);
  }, []);

  /** Shows the cart the store holds and tells the visitor, in info toasts, what the store changed on its own. */
  const apply = useCallback(
    ({ cart: next, notices }: CartUpdate) => {
      setCart(next);
      for (const notice of notices) {
        notify({ tone: "info", message: noticeMessage(notice) });
        analytics.track(cartAdjustedEvent(notice));
      }
    },
    [setCart, notify, analytics],
  );

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
      apply(await manageCart.getCart());
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
      analytics.captureException(error, { area: "cart", action: "load" });
    } finally {
      setReady(true);
    }
  }, [manageCart, analytics, apply]);

  const refresh = useCallback(() => enqueue(load, false), [enqueue, load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || cartStorageKeys.includes(event.key)) void refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh, cartStorageKeys]);

  const showDrawer = useCallback(() => {
    isOpenRef.current = true;
    setIsOpen(true);
  }, []);

  /** Only a visitor-initiated open counts as cart_viewed; the automatic open after addItem does not. */
  const openCart = useCallback(() => {
    const current = cartRef.current;
    if (!isOpenRef.current && current) analytics.track({ name: "cart_viewed", properties: cartProperties(current) });
    showDrawer();
  }, [analytics, showDrawer]);
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
          const update = await manageCart.addToCart(product.id, new Quantity(quantity));
          apply(update);
          const added = unitsAdded(product.id.value, quantity, update.notices);
          if (added === 0) {
            // The store had no stock left for it; the info toast says so.
            analytics.track({
              name: "add_to_cart_failed",
              properties: { product_id: product.id.value, variant_title: product.variantTitle, quantity, reason: "out_of_stock" },
            });
            return false;
          }
          // The drawer opening (a labelled dialog that takes focus) is the confirmation.
          showDrawer();
          analytics.track({
            name: "product_added_to_cart",
            properties: { ...productProperties(product), ...cartProperties(update.cart), quantity: added, source },
          });
          return true;
        } catch (error) {
          const reason = failureReason(error);
          notify({ tone: "error", message: toUserMessage(error, { productName: product.displayName }) });
          analytics.track({
            name: "add_to_cart_failed",
            properties: { product_id: product.id.value, variant_title: product.variantTitle, quantity, reason },
          });
          if (reason === "unknown") analytics.captureException(error, { area: "cart", action: "add" });
          return false;
        }
      }, true),
    [enqueue, manageCart, apply, showDrawer, notify, analytics],
  );

  /** After a failed change the stored cart may differ from what is shown (e.g. edited in another tab). */
  const recover = useCallback(async () => {
    try {
      apply(await manageCart.getCart());
    } catch {
      // Keep showing the last known cart.
    }
  }, [manageCart, apply]);

  const setItemQuantity = useCallback(
    (productId: string, quantity: number) =>
      enqueue(async () => {
        const line = findLine(cartRef.current, productId);
        try {
          const update = await manageCart.setQuantity(new ProductId(productId), new Quantity(quantity));
          apply(update);
          const updated = update.cart;
          if (!line) return;
          // What the store kept, which can be less than asked for when stock is short.
          const delta = updated.quantityOf(line.product.id) - line.quantity.value;
          const properties = { ...productProperties(line.product), ...cartProperties(updated), quantity: Math.abs(delta) };
          if (delta > 0) {
            analytics.track({ name: "product_added_to_cart", properties: { ...properties, source: "cart_drawer" } });
          } else if (delta < 0) {
            analytics.track({ name: "product_removed_from_cart", properties });
          }
        } catch (error) {
          reportFailure(error, { productName: line?.product.displayName, action: "set_quantity" });
          await recover();
        }
      }, true),
    [enqueue, manageCart, apply, analytics, reportFailure, recover],
  );

  const removeItem = useCallback(
    (productId: string) =>
      enqueue(async () => {
        const line = findLine(cartRef.current, productId);
        try {
          const update = await manageCart.deleteFromCart(new ProductId(productId));
          apply(update);
          const updated = update.cart;
          if (line) {
            analytics.track({
              name: "product_removed_from_cart",
              properties: { ...productProperties(line.product), ...cartProperties(updated), quantity: line.quantity.value },
            });
          }
        } catch (error) {
          reportFailure(error, { productName: line?.product.displayName, action: "remove" });
          await recover();
        }
      }, true),
    [enqueue, manageCart, apply, analytics, reportFailure, recover],
  );

  const clearCart = useCallback(
    () =>
      enqueue(async () => {
        try {
          apply(await manageCart.clearCart());
        } catch (error) {
          reportFailure(error, { action: "clear" });
          await recover();
        }
      }, true),
    [enqueue, manageCart, apply, reportFailure, recover],
  );

  const checkout = useCallback(
    ({ replace = false }: CheckoutOptions = {}) =>
      enqueue(async () => {
        const current = cartRef.current;
        if (!current || current.isEmpty()) return false;
        try {
          const session = await createCheckout.execute({
            analyticsConsent: consentRepository.get()?.analytics ?? null,
            attribution: analytics.checkoutAttribution(),
          });
          analytics.track({
            name: "checkout_started",
            properties: { ...cartProperties(current), checkout_type: session.type },
          });
          closeCart();
          if (session.type === "hosted") {
            if (replace) window.location.replace(session.url);
            else window.location.assign(session.url);
          } else {
            router.push(session.url);
          }
          return true;
        } catch (error) {
          if (error instanceof ValidationError) {
            // The stored cart is empty (e.g. emptied in another tab): say so and show it.
            notify({ tone: "error", message: messages.cart.checkoutEmpty });
            await recover();
            return false;
          }
          notify({ tone: "error", message: messages.errors.checkoutUnavailable });
          analytics.track({ name: "checkout_failed", properties: cartProperties(current) });
          analytics.captureException(error, { area: "cart", action: "checkout" });
          return false;
        }
      }, true),
    [enqueue, createCheckout, consentRepository, analytics, closeCart, router, notify, recover],
  );

  const runExclusive = useCallback(
    <T,>(task: () => Promise<T>): Promise<T> => {
      const run = enqueue(task, true);
      // Queued right behind the task (before any later mutation) whatever its outcome, and counted as a
      // mutation so `pending` stays true until the refreshed cart is shown. The caller resumes first.
      void enqueue(load, true);
      return run;
    },
    [enqueue, load],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      ready,
      loadError,
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
      runExclusive,
    }),
    [
      cart,
      ready,
      loadError,
      pendingCount,
      isOpen,
      openCart,
      closeCart,
      addItem,
      setItemQuantity,
      removeItem,
      clearCart,
      checkout,
      refresh,
      runExclusive,
    ],
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
