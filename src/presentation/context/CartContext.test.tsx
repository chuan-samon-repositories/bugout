// @vitest-environment jsdom
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import type { Product } from "@/domain/entities/product/Product";
import { BusinessRuleError, ValidationError } from "@/domain/errors";
import { getContainer, resetContainer } from "@/infrastructure/config";
import { useCart } from "./CartContext";

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

async function product(id: string): Promise<Product> {
  const products = await getContainer().getGetProductsUseCase().execute();
  const found = products.find((candidate) => candidate.id.value === id);
  if (!found) throw new Error(`Missing fixture ${id}`);
  return found;
}

async function renderCart() {
  const hook = renderHook(() => useCart(), { wrapper: Providers });
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  return hook;
}

describe("CartProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    resetContainer();
    router.push.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws a clear error outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCart())).toThrow(/CartProvider/);
  });

  it("restores the stored cart on mount", async () => {
    localStorage.setItem("bugout.cart", JSON.stringify({ version: 2, items: [{ productId: "kit-medicina", quantity: 3 }] }));
    const { result } = await renderCart();
    expect(result.current.itemCount).toBe(3);
    expect(result.current.subtotal?.amount).toBe(54);
    expect(result.current.isOpen).toBe(false);
  });

  it("adds an item, opens the drawer as the confirmation (no success toast) and tracks the event (but not cart_viewed)", async () => {
    const track = vi.spyOn(getContainer().getAnalyticsService(), "track");
    const backpack = await product("mochila-65l");
    const { result } = await renderCart();

    let added = false;
    await act(async () => {
      added = await result.current.addItem(backpack, 2);
    });

    expect(added).toBe(true);
    expect(result.current.itemCount).toBe(2);
    expect(result.current.isOpen).toBe(true);
    // A success toast would cover the drawer's footer buttons; the opened drawer is the confirmation.
    expect(screen.queryByText("Añadido al carrito")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith({
      name: "product_added_to_cart",
      properties: expect.objectContaining({
        product_id: "mochila-65l",
        quantity: 2,
        source: "product_page",
        cart_value: 178,
        cart_item_count: 2,
        currency: "EUR",
      }),
    });
    expect(track).not.toHaveBeenCalledWith(expect.objectContaining({ name: "cart_viewed" }));
  });

  it("tracks cart_viewed only when the visitor opens the drawer, once per opening", async () => {
    const track = vi.spyOn(getContainer().getAnalyticsService(), "track");
    localStorage.setItem("bugout.cart", JSON.stringify({ version: 2, items: [{ productId: "kit-medicina", quantity: 1 }] }));
    const { result } = await renderCart();

    act(() => result.current.openCart());
    act(() => result.current.openCart());
    expect(result.current.isOpen).toBe(true);
    const viewed = () => track.mock.calls.filter(([event]) => event.name === "cart_viewed");
    expect(viewed()).toEqual([[{ name: "cart_viewed", properties: { cart_value: 18, cart_item_count: 1, currency: "EUR" } }]]);

    act(() => result.current.closeCart());
    act(() => result.current.openCart());
    expect(viewed()).toHaveLength(2);
  });

  it("reports a failed load and recovers on refresh", async () => {
    const container = getContainer();
    vi.spyOn(container.getAnalyticsService(), "captureException");
    const getCart = vi.spyOn(container.getManageCartUseCase(), "getCart").mockRejectedValueOnce(new Error("offline"));
    const { result } = await renderCart();
    expect(result.current.loadError).toBe(true);
    expect(result.current.cart).toBeNull();

    await act(() => result.current.refresh());
    expect(getCart).toHaveBeenCalledTimes(2);
    expect(result.current.loadError).toBe(false);
    expect(result.current.cart?.isEmpty()).toBe(true);
  });

  it("runs an exclusive task inside the mutation queue and refreshes the cart afterwards", async () => {
    const backpack = await product("mochila-65l");
    const { result } = await renderCart();
    const getCart = vi.spyOn(getContainer().getManageCartUseCase(), "getCart");

    let release: (value: string) => void = () => {};
    const task = vi.fn(() => new Promise<string>((resolve) => (release = resolve)));
    let exclusive: Promise<string> = Promise.resolve("");
    let added: Promise<boolean> = Promise.resolve(false);
    act(() => {
      exclusive = result.current.runExclusive(task);
      added = result.current.addItem(backpack, 1);
    });
    await waitFor(() => expect(task).toHaveBeenCalled());
    expect(result.current.pending).toBe(true);
    expect(result.current.itemCount).toBe(0);

    // Simulates an order that empties the stored cart behind the provider's back.
    await act(async () => {
      release("BUG-1");
      await expect(exclusive).resolves.toBe("BUG-1");
      await added;
    });
    expect(getCart).toHaveBeenCalledTimes(1);
    expect(result.current.itemCount).toBe(1);
    expect(result.current.pending).toBe(false);
  });

  it("passes an exclusive task's failure through and still refreshes", async () => {
    const { result } = await renderCart();
    const getCart = vi.spyOn(getContainer().getManageCartUseCase(), "getCart");
    await act(async () => {
      await expect(result.current.runExclusive(() => Promise.reject(new Error("rejected")))).rejects.toThrow("rejected");
    });
    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(1));
    expect(result.current.pending).toBe(false);
  });

  it("shows a Spanish error and tracks the failure when a product is out of stock", async () => {
    const container = getContainer();
    const track = vi.spyOn(container.getAnalyticsService(), "track");
    const captureException = vi.spyOn(container.getAnalyticsService(), "captureException");
    vi.spyOn(container.getManageCartUseCase(), "addToCart").mockRejectedValue(
      new BusinessRuleError("OUT_OF_STOCK", "out of stock"),
    );
    const backpack = await product("mochila-65l");
    const { result } = await renderCart();

    let added = true;
    await act(async () => {
      added = await result.current.addItem(backpack, 1);
    });

    expect(added).toBe(false);
    expect(result.current.isOpen).toBe(false);
    expect(screen.getByRole("alert")).toHaveTextContent("Mochila de supervivencia 65L está agotado.");
    expect(track).toHaveBeenCalledWith({
      name: "add_to_cart_failed",
      properties: { product_id: "mochila-65l", quantity: 1, reason: "out_of_stock" },
    });
    expect(captureException).not.toHaveBeenCalled();
  });

  it("rejects invalid quantities without touching the cart", async () => {
    vi.spyOn(getContainer().getAnalyticsService(), "captureException");
    const backpack = await product("mochila-65l");
    const { result } = await renderCart();

    let added = true;
    await act(async () => {
      added = await result.current.addItem(backpack, 0);
    });

    expect(added).toBe(false);
    expect(result.current.itemCount).toBe(0);
    expect(screen.getByRole("alert")).toHaveTextContent("Algo ha salido mal");
  });

  it("serializes rapid mutations so none is lost", async () => {
    const backpack = await product("mochila-65l");
    const food = await product("radio-solar");
    const { result } = await renderCart();

    let all: Promise<unknown> = Promise.resolve();
    act(() => {
      all = Promise.all([
        result.current.addItem(backpack, 1),
        result.current.addItem(backpack, 1),
        result.current.addItem(food, 1),
        result.current.addItem(backpack, 1),
      ]);
    });
    expect(result.current.pending).toBe(true);
    await act(async () => {
      await all;
    });

    expect(result.current.pending).toBe(false);
    expect(result.current.itemCount).toBe(4);
    expect(result.current.cart?.getItems().map((item) => [item.product.id.value, item.quantity.value])).toEqual([
      ["mochila-65l", 3],
      ["radio-solar", 1],
    ]);
  });

  it("changes quantities, removes lines and clears the cart", async () => {
    const track = vi.spyOn(getContainer().getAnalyticsService(), "track");
    localStorage.setItem(
      "bugout.cart",
      JSON.stringify({
        version: 2,
        items: [
          { productId: "kit-medicina", quantity: 1 },
          { productId: "radio-solar", quantity: 2 },
        ],
      }),
    );
    const { result } = await renderCart();

    await act(() => result.current.setItemQuantity("kit-medicina", 4));
    expect(result.current.itemCount).toBe(6);
    expect(track).toHaveBeenCalledWith({
      name: "product_added_to_cart",
      properties: expect.objectContaining({ product_id: "kit-medicina", quantity: 3, source: "cart_drawer" }),
    });

    await act(() => result.current.removeItem("radio-solar"));
    expect(result.current.itemCount).toBe(4);
    expect(track).toHaveBeenCalledWith({
      name: "product_removed_from_cart",
      properties: expect.objectContaining({ product_id: "radio-solar", quantity: 2, cart_item_count: 4 }),
    });

    await act(() => result.current.clearCart());
    expect(result.current.itemCount).toBe(0);
    expect(localStorage.getItem("bugout.cart")).toBeNull();
  });

  it("shows an error toast when a quantity change fails", async () => {
    vi.spyOn(getContainer().getManageCartUseCase(), "setQuantity").mockRejectedValue(
      new BusinessRuleError("MAX_QUANTITY_EXCEEDED", "too many"),
    );
    localStorage.setItem("bugout.cart", JSON.stringify({ version: 2, items: [{ productId: "kit-medicina", quantity: 1 }] }));
    const { result } = await renderCart();

    await act(() => result.current.setItemQuantity("kit-medicina", 100));
    expect(screen.getByRole("alert")).toHaveTextContent("Puedes añadir como máximo 99 unidades de cada producto.");
    expect(result.current.itemCount).toBe(1);
  });

  it("tracks checkout_started and navigates to the local checkout", async () => {
    const track = vi.spyOn(getContainer().getAnalyticsService(), "track");
    localStorage.setItem("bugout.cart", JSON.stringify({ version: 2, items: [{ productId: "kit-medicina", quantity: 1 }] }));
    const { result } = await renderCart();
    act(() => result.current.openCart());

    await act(() => result.current.checkout());

    expect(track).toHaveBeenCalledWith({
      name: "checkout_started",
      properties: { cart_value: 18, cart_item_count: 1, currency: "EUR", checkout_type: "local" },
    });
    expect(router.push).toHaveBeenCalledWith("/checkout");
    expect(result.current.isOpen).toBe(false);
  });

  it("uses a full page navigation for hosted checkouts", async () => {
    const assign = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, assign });
    vi.spyOn(getContainer().getCreateCheckoutUseCase(), "execute").mockResolvedValue({
      url: "https://tienda.myshopify.com/checkouts/abc",
      type: "hosted",
    });
    localStorage.setItem("bugout.cart", JSON.stringify({ version: 2, items: [{ productId: "kit-medicina", quantity: 1 }] }));
    const { result } = await renderCart();

    await act(() => result.current.checkout());

    expect(assign).toHaveBeenCalledWith("https://tienda.myshopify.com/checkouts/abc");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("replaces the current history entry for a hosted checkout when asked (the /checkout hand-off)", async () => {
    const assign = vi.fn();
    const replace = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, assign, replace });
    vi.spyOn(getContainer().getCreateCheckoutUseCase(), "execute").mockResolvedValue({
      url: "https://tienda.myshopify.com/checkouts/abc",
      type: "hosted",
    });
    localStorage.setItem("bugout.cart", JSON.stringify({ version: 2, items: [{ productId: "kit-medicina", quantity: 1 }] }));
    const { result } = await renderCart();

    let started = false;
    await act(async () => {
      started = await result.current.checkout({ replace: true });
    });

    expect(started).toBe(true);
    expect(replace).toHaveBeenCalledWith("https://tienda.myshopify.com/checkouts/abc");
    expect(assign).not.toHaveBeenCalled();
  });

  it("shows an error toast when checkout cannot start", async () => {
    vi.spyOn(getContainer().getAnalyticsService(), "captureException");
    vi.spyOn(getContainer().getCreateCheckoutUseCase(), "execute").mockRejectedValue(new Error("down"));
    localStorage.setItem("bugout.cart", JSON.stringify({ version: 2, items: [{ productId: "kit-medicina", quantity: 1 }] }));
    const { result } = await renderCart();

    await act(() => result.current.checkout());

    expect(screen.getByRole("alert")).toHaveTextContent("No hemos podido iniciar el pago");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("tells the visitor the cart is empty when checkout finds no items, without reporting an exception", async () => {
    const captureException = vi.spyOn(getContainer().getAnalyticsService(), "captureException");
    vi.spyOn(getContainer().getCreateCheckoutUseCase(), "execute").mockRejectedValue(new ValidationError("Cart is empty"));
    localStorage.setItem("bugout.cart", JSON.stringify({ version: 2, items: [{ productId: "kit-medicina", quantity: 1 }] }));
    const { result } = await renderCart();
    localStorage.removeItem("bugout.cart");

    let started = true;
    await act(async () => {
      started = await result.current.checkout();
    });

    expect(started).toBe(false);
    expect(screen.getByRole("alert")).toHaveTextContent("Tu carrito está vacío. Añade algún producto para finalizar la compra.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Cart is empty");
    expect(captureException).not.toHaveBeenCalled();
    expect(result.current.itemCount).toBe(0);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("ignores storage events for keys that are not the cart's", async () => {
    const { result } = await renderCart();
    const getCart = vi.spyOn(getContainer().getManageCartUseCase(), "getCart");
    const { cart: cartKeys, consent } = getContainer().getSyncedStorageKeys();

    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: consent }));
      window.dispatchEvent(new StorageEvent("storage", { key: "bugout.something-else" }));
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(getCart).not.toHaveBeenCalled();

    for (const [index, key] of cartKeys.entries()) {
      act(() => {
        window.dispatchEvent(new StorageEvent("storage", { key }));
      });
      await waitFor(() => expect(getCart).toHaveBeenCalledTimes(index + 1));
    }
    expect(cartKeys.length).toBeGreaterThan(0);
    expect(result.current.itemCount).toBe(0);
  });

  it("reloads when another tab clears storage (key null)", async () => {
    await renderCart();
    const getCart = vi.spyOn(getContainer().getManageCartUseCase(), "getCart");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(1));
  });

  it("reloads when another tab changes the stored cart", async () => {
    const { result } = await renderCart();
    expect(result.current.itemCount).toBe(0);

    localStorage.setItem("bugout.cart", JSON.stringify({ version: 2, items: [{ productId: "kit-medicina", quantity: 2 }] }));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "bugout.cart" }));
    });

    await waitFor(() => expect(result.current.itemCount).toBe(2));
  });
});
