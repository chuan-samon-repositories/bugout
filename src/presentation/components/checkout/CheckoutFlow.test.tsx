// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/domain/errors";
import { messages } from "@/presentation/i18n";
import type { OrderConfirmation } from "@/application/dtos/Order";
import { Cart } from "@/domain/entities/cart/Cart";
import { buildProduct } from "@/domain/testing/buildProduct";
import { Money } from "@/domain/value-objects/Money";
import { Quantity } from "@/domain/value-objects/Quantity";
import { getContainer } from "@/infrastructure/config";
import { CheckoutFlow } from "./CheckoutFlow";

const mocks = vi.hoisted(() => {
  type Snapshot = { cart: import("@/domain/entities/cart/Cart").Cart | null; ready: boolean; loadError?: boolean };
  const listeners = new Set<() => void>();
  const store = {
    snapshot: { cart: null, ready: false } as Snapshot,
    set(next: Snapshot) {
      store.snapshot = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    store,
    checkout: vi.fn<(options?: { replace?: boolean }) => Promise<boolean>>(async () => false),
    refresh: vi.fn(async (): Promise<void> => undefined),
    /** Like CartContext.runExclusive: runs the task, then the cart is reloaded (see `afterExclusive`). */
    runExclusive: vi.fn(async <T,>(task: () => Promise<T>): Promise<T> => {
      try {
        return await task();
      } finally {
        void Promise.resolve().then(() => mocks.afterExclusive());
      }
    }),
    afterExclusive: vi.fn((): void => undefined),
    push: vi.fn(),
    analytics: { track: vi.fn(), captureException: vi.fn(), setConsent: vi.fn() },
    notify: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.push }),
  redirect: mocks.push,
}));

vi.mock("@/presentation/context/AnalyticsContext", () => ({ useAnalytics: () => mocks.analytics }));
vi.mock("@/presentation/context/NotificationContext", () => ({ useNotifications: () => ({ notify: mocks.notify, dismiss: vi.fn() }) }));

vi.mock("@/presentation/context/CartContext", async () => {
  const { useSyncExternalStore } = await import("react");
  return {
    useCart: () => {
      const { cart, ready, loadError = false } = useSyncExternalStore(mocks.store.subscribe, () => mocks.store.snapshot);
      return {
        cart,
        ready,
        loadError,
        pending: false,
        itemCount: cart?.itemCount() ?? 0,
        subtotal: ready && cart ? cart.totalAmount() : null,
        isOpen: false,
        openCart: vi.fn(),
        closeCart: vi.fn(),
        addItem: vi.fn(),
        setItemQuantity: vi.fn(),
        removeItem: vi.fn(),
        clearCart: vi.fn(),
        checkout: mocks.checkout,
        refresh: mocks.refresh,
        runExclusive: mocks.runExclusive,
      };
    },
  };
});

vi.mock("@/infrastructure/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/config")>();
  const container = actual.createContainer({ provider: "local", posthog: null, simulatedDelayMs: 0 });
  return { ...actual, getContainer: () => container };
});

const eur = (major: number) => Money.fromMajor(major, "EUR");

function cartWith(priceMajor: number, quantity = 1): Cart {
  const cart = new Cart("EUR");
  cart.addItem(buildProduct({ id: "mochila-72h", name: "Mochila 72H", price: priceMajor }), new Quantity(quantity));
  return cart;
}

function setCart(cart: Cart | null, ready = true) {
  mocks.store.set({ cart, ready });
}

const confirmations = () => getContainer().getOrderConfirmationStore();

async function fillContact(user = userEvent.setup()) {
  await user.type(screen.getByRole("textbox", { name: "Correo electrónico" }), "Ana@Example.es");
  await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Ana");
  await user.type(screen.getByRole("textbox", { name: "Apellidos" }), "García");
  await user.click(screen.getByRole("button", { name: "Continuar con el envío" }));
  await screen.findByRole("heading", { level: 2, name: "Envío" });
}

async function fillShipping(user = userEvent.setup()) {
  await user.type(screen.getByRole("textbox", { name: "Dirección" }), "Calle Mayor 1");
  await user.type(screen.getByRole("textbox", { name: "Código postal" }), "28013");
  await user.type(screen.getByRole("textbox", { name: "Localidad" }), "Madrid");
  await user.selectOptions(screen.getByRole("combobox", { name: "Provincia" }), "Madrid");
  await user.click(screen.getByRole("button", { name: "Revisar el pedido" }));
  await screen.findByRole("heading", { level: 2, name: "Revisión" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.analytics.track.mockReset();
  mocks.afterExclusive.mockReset();
  window.sessionStorage.clear();
  confirmations().clear();
  mocks.store.set({ cart: null, ready: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CheckoutFlow", () => {
  it("shows a spinner while the cart loads and never redirects", () => {
    render(<CheckoutFlow provider="local" />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando tu carrito…");
    expect(screen.queryByText("Tu carrito está vacío")).not.toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.checkout).not.toHaveBeenCalled();
  });

  it("shows a friendly empty state with a link to the catalog", () => {
    setCart(new Cart("EUR"));
    render(<CheckoutFlow provider="local" />);
    expect(screen.getByRole("heading", { name: "Tu carrito está vacío" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver productos" })).toHaveAttribute("href", "/products");
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("shows the cart drawer's load error with a retry instead of the empty state when the cart could not load", async () => {
    mocks.store.set({ cart: null, ready: true, loadError: true });
    render(<CheckoutFlow provider="local" />);
    expect(screen.getByRole("alert")).toHaveTextContent(messages.cart.loadError);
    expect(screen.queryByText("Tu carrito está vacío")).not.toBeInTheDocument();

    mocks.refresh.mockImplementationOnce(async () => setCart(cartWith(60)));
    await userEvent.click(screen.getByRole("button", { name: messages.cart.retryLoad }));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("heading", { level: 2, name: "Contacto" })).toBeInTheDocument();
  });

  it("blocks step 1 on empty required fields with Spanish messages and focuses the first invalid field", async () => {
    setCart(cartWith(60));
    render(<CheckoutFlow provider="local" />);
    await userEvent.click(screen.getByRole("button", { name: "Continuar con el envío" }));

    const email = screen.getByRole("textbox", { name: "Correo electrónico" });
    expect(email).toHaveFocus();
    expect(email).toHaveAccessibleDescription("Este campo es obligatorio.");
    expect(screen.getByText("Revisa los siguientes 3 campos:")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nombre: Este campo es obligatorio." })).toHaveAttribute(
      "href",
      "#checkout-customer-firstName",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Contacto" })).toBeInTheDocument();
    expect(mocks.analytics.track).not.toHaveBeenCalled();
  });

  it("advances to shipping, tracks the step and moves focus to the step heading", async () => {
    setCart(cartWith(60));
    render(<CheckoutFlow provider="local" />);
    await fillContact();

    expect(screen.getByRole("heading", { level: 2, name: "Envío" })).toHaveFocus();
    expect(mocks.analytics.track).toHaveBeenCalledWith({
      name: "checkout_step_completed",
      properties: { step: 1, step_name: "contact", cart_value: 60, cart_item_count: 1, currency: "EUR" },
    });
    const steps = screen.getByRole("list", { name: "Pasos para finalizar la compra" });
    expect(within(steps).getByRole("button", { name: /Contacto/ })).toBeInTheDocument();
    expect(within(steps).queryByRole("button", { name: /Revisión/ })).not.toBeInTheDocument();
    expect(within(steps).getByText("Envío").closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("prices shipping options with what is actually charged: free standard over the threshold, express never free", async () => {
    setCart(cartWith(80));
    render(<CheckoutFlow provider="local" />);
    await fillContact();

    expect(screen.getByRole("radio", { name: /Estándar/ })).toHaveAccessibleName(/Gratis/);
    expect(screen.getByRole("radio", { name: /Urgente/ })).toHaveAccessibleName(/9,95\s€/);
    expect(screen.getByRole("radio", { name: /24 horas/ })).toHaveAccessibleName(/14,95\s€/);

    await userEvent.click(screen.getByRole("radio", { name: /Urgente/ }));
    const summary = screen.getByRole("complementary", { name: "Resumen del pedido" });
    expect(within(summary).getByText("Envío (Urgente)").nextElementSibling).toHaveTextContent(/9,95\s€/);
    expect(within(summary).getByText("IVA incluido (21 %)")).toBeInTheDocument();
  });

  it("charges standard shipping under the free threshold", async () => {
    setCart(cartWith(60));
    render(<CheckoutFlow provider="local" />);
    await fillContact();
    expect(screen.getByRole("radio", { name: /Estándar/ })).toHaveAccessibleName(/4,95\s€/);
    expect(screen.getByRole("radio", { name: /Estándar/ })).toHaveAccessibleName(/Gratis a partir de 75,00\s€/);
  });

  it("validates the Spanish postal code before the review step", async () => {
    setCart(cartWith(60));
    render(<CheckoutFlow provider="local" />);
    await fillContact();
    await userEvent.type(screen.getByRole("textbox", { name: "Dirección" }), "Calle Mayor 1");
    await userEvent.type(screen.getByRole("textbox", { name: "Código postal" }), "99999");
    await userEvent.click(screen.getByRole("button", { name: "Revisar el pedido" }));

    expect(screen.getByRole("textbox", { name: "Código postal" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Código postal" })).toHaveAccessibleDescription(
      /código postal español de 5 cifras/,
    );
  });

  it("shows the confirmation from the order snapshot after the cart is cleared", async () => {
    const cart = cartWith(80);
    setCart(cart);
    const confirmation: OrderConfirmation = {
      orderNumber: "BUG-7K2Q9XA1",
      placedAt: "2026-09-26T10:00:00.000Z",
      email: "Ana@Example.es",
      lines: [{ productId: "mochila-72h", name: "Mochila 72H", quantity: 1, unitPriceMinor: 8000, subtotalMinor: 8000 }],
      totals: { subtotal: eur(80), shipping: eur(9.95), tax: eur(15.61), total: eur(89.95) },
      shippingMethod: "express",
    };
    const execute = vi.spyOn(getContainer().getPlaceOrderUseCase(), "execute").mockResolvedValue(confirmation);
    mocks.afterExclusive.mockImplementation(() => setCart(new Cart("EUR")));

    render(<CheckoutFlow provider="local" />);
    await fillContact();
    await userEvent.click(screen.getByRole("radio", { name: /Urgente/ }));
    await fillShipping();

    expect(screen.getByText(/Modo demostración: no se realizará ningún cargo/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    const heading = await screen.findByRole("heading", { level: 1, name: "¡Gracias por tu pedido!" });
    expect(heading).toHaveFocus();
    expect(document.title).toBe("Pedido confirmado · Bugout");
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        shippingMethod: "express",
        customer: expect.objectContaining({ email: "Ana@Example.es" }),
        shippingAddress: expect.objectContaining({ postalCode: "28013", province: "Madrid", country: "ES" }),
      }),
    );
    expect(mocks.runExclusive).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mocks.store.snapshot.cart?.isEmpty()).toBe(true));

    expect(screen.getByText("BUG-7K2Q9XA1")).toBeInTheDocument();
    expect(screen.getByText("Ana@Example.es")).toBeInTheDocument();
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent(/89,95\s€/);
    expect(screen.queryByText("Tu carrito está vacío")).not.toBeInTheDocument();

    expect(mocks.analytics.captureException).not.toHaveBeenCalled();
    expect(screen.getByText("Ana@Example.es").closest(".ph-no-capture")).not.toBeNull();
    const completed = mocks.analytics.track.mock.calls.filter(([event]) => event.name === "checkout_step_completed");
    expect(completed.map(([event]) => event.properties.step_name)).toEqual(["contact", "shipping", "review"]);
    expect(mocks.analytics.track).toHaveBeenCalledWith({
      name: "order_completed",
      properties: {
        order_id: "BUG-7K2Q9XA1",
        revenue: 89.95,
        shipping: 9.95,
        tax: 15.61,
        currency: "EUR",
        item_count: 1,
        shipping_method: "express",
        products: [{ product_id: "mochila-72h", quantity: 1, price: 80 }],
      },
    });
    expect(confirmations().load()?.orderNumber).toBe("BUG-7K2Q9XA1");
  });

  it("shows the confirmation even when order analytics throws", async () => {
    setCart(cartWith(60));
    vi.spyOn(getContainer().getPlaceOrderUseCase(), "execute").mockResolvedValue({
      orderNumber: "BUG-NOANALYT",
      placedAt: "2026-09-26T10:00:00.000Z",
      email: "ana@example.es",
      lines: [{ productId: "mochila-72h", name: "Mochila 72H", quantity: 1, unitPriceMinor: 6000, subtotalMinor: 6000 }],
      totals: { subtotal: eur(60), shipping: eur(4.95), tax: eur(11.27), total: eur(64.95) },
      shippingMethod: "standard",
    });
    render(<CheckoutFlow provider="local" />);
    await fillContact();
    await fillShipping();
    mocks.analytics.track.mockImplementation(() => {
      throw new Error("analytics down");
    });
    await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    expect(await screen.findByRole("heading", { level: 1, name: "¡Gracias por tu pedido!" })).toBeInTheDocument();
    expect(screen.getByText("BUG-NOANALYT")).toBeInTheDocument();
    expect(mocks.analytics.captureException).toHaveBeenCalledWith(expect.any(Error), { area: "checkout", action: "track_order" });
  });

  it("does not offer the newsletter opt-in while messaging is disabled, and places the order without it", async () => {
    expect(getContainer().isMessagingSimulated()).toBe(true);
    setCart(cartWith(60));
    const execute = vi.spyOn(getContainer().getPlaceOrderUseCase(), "execute");
    render(<CheckoutFlow provider="local" />);
    expect(screen.queryByRole("checkbox", { name: messages.checkout.marketingOptIn })).not.toBeInTheDocument();
    await fillContact();
    await fillShipping();
    expect(screen.queryByText(messages.checkout.review.marketingYes)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));
    await waitFor(() => expect(execute).toHaveBeenCalled());
    expect(execute.mock.calls[0][0].marketingOptIn).toBe(false);
  });

  it("offers the newsletter opt-in once messaging is enabled and confirms it on review", async () => {
    vi.spyOn(getContainer(), "isMessagingSimulated").mockReturnValue(false);
    setCart(cartWith(60));
    render(<CheckoutFlow provider="local" />);
    await userEvent.click(screen.getByRole("checkbox", { name: messages.checkout.marketingOptIn }));
    await fillContact();
    await fillShipping();
    expect(screen.getByText("Recibirás novedades por correo.")).toBeInTheDocument();
  });

  it("tracks each step once per checkout, even after going back and resubmitting", async () => {
    setCart(cartWith(60));
    render(<CheckoutFlow provider="local" />);
    const user = userEvent.setup();
    await fillContact(user);
    await user.click(screen.getByRole("button", { name: "Volver" }));
    await screen.findByRole("heading", { level: 2, name: "Contacto" });
    await user.click(screen.getByRole("button", { name: "Continuar con el envío" }));
    await screen.findByRole("heading", { level: 2, name: "Envío" });
    await fillShipping(user);
    await user.click(screen.getByRole("button", { name: /Editar\s*datos de contacto/ }));
    await user.click(await screen.findByRole("button", { name: "Continuar con el envío" }));
    await screen.findByRole("heading", { level: 2, name: "Revisión" });

    const completed = mocks.analytics.track.mock.calls.filter(([event]) => event.name === "checkout_step_completed");
    expect(completed.map(([event]) => event.properties.step_name)).toEqual(["contact", "shipping"]);
  });

  it("offers only shippable provinces and preselects the one matching the postal code", async () => {
    setCart(cartWith(60));
    render(<CheckoutFlow provider="local" />);
    await fillContact();

    const province = screen.getByRole("combobox", { name: "Provincia" });
    const options = within(province).getAllByRole("option").map((option) => option.textContent);
    expect(options).toEqual(expect.arrayContaining(["Madrid", "Illes Balears", "A Coruña"]));
    for (const excluded of ["Las Palmas", "Santa Cruz de Tenerife", "Ceuta", "Melilla"]) {
      expect(options).not.toContain(excluded);
    }

    const postalCode = screen.getByRole("textbox", { name: "Código postal" });
    await userEvent.type(postalCode, "08001");
    expect(province).toHaveValue("Barcelona");
    await userEvent.clear(postalCode);
    await userEvent.type(postalCode, "28013");
    expect(province).toHaveValue("Madrid");
    expect(screen.getByRole("textbox", { name: "Código postal" }).closest(".ph-no-capture")).not.toBeNull();
  });

  it("explains a postal code that does not belong to the selected province", async () => {
    setCart(cartWith(60));
    render(<CheckoutFlow provider="local" />);
    await fillContact();
    await userEvent.type(screen.getByRole("textbox", { name: "Dirección" }), "Calle Mayor 1");
    await userEvent.type(screen.getByRole("textbox", { name: "Localidad" }), "Madrid");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Provincia" }), "Sevilla");
    await userEvent.type(screen.getByRole("textbox", { name: "Código postal" }), "28013");
    await userEvent.click(screen.getByRole("button", { name: "Revisar el pedido" }));

    expect(screen.getByRole("textbox", { name: "Código postal" })).toHaveAccessibleDescription(
      "Este código postal no corresponde a la provincia seleccionada.",
    );
  });

  it("returns to the step owning the first failing field when placing the order is rejected", async () => {
    const { FormValidationError } = await import("@/application/errors");
    setCart(cartWith(60));
    vi.spyOn(getContainer().getPlaceOrderUseCase(), "execute").mockRejectedValue(
      new FormValidationError({ "shippingAddress.city": "required" }),
    );
    render(<CheckoutFlow provider="local" />);
    await fillContact();
    await fillShipping();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    const city = await screen.findByRole("textbox", { name: "Localidad" });
    await waitFor(() => expect(city).toHaveFocus());
    expect(city).toHaveAccessibleDescription("Este campo es obligatorio.");
  });

  it("explains, instead of failing silently, when the cart was emptied before confirming", async () => {
    setCart(cartWith(60));
    vi.spyOn(getContainer().getPlaceOrderUseCase(), "execute").mockRejectedValue(new ValidationError("Cart is empty"));
    render(<CheckoutFlow provider="local" />);
    await fillContact();
    await fillShipping();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    await waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith({ tone: "info", message: messages.cart.checkoutEmpty }),
    );
    expect(mocks.analytics.captureException).not.toHaveBeenCalled();
  });

  it("offers a retry when placing the order fails", async () => {
    setCart(cartWith(60));
    const execute = vi.spyOn(getContainer().getPlaceOrderUseCase(), "execute").mockRejectedValue(new Error("offline"));
    render(<CheckoutFlow provider="local" />);
    await fillContact();
    await fillShipping();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No hemos podido confirmar tu pedido.");
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("restores the last confirmation after a reload when the cart is empty", () => {
    confirmations().save({
        orderNumber: "BUG-RELOADED",
        placedAt: "2026-09-26T10:00:00.000Z",
        email: "ana@example.es",
        lines: [{ productId: "kit", name: "Kit 24H", quantity: 2, unitPriceMinor: 3900, subtotalMinor: 7800 }],
        totals: { subtotal: eur(78), shipping: eur(0), tax: eur(13.54), total: eur(78) },
        shippingMethod: "standard",
    });
    setCart(new Cart("EUR"));
    render(<CheckoutFlow provider="local" />);
    expect(screen.getByText("BUG-RELOADED")).toBeInTheDocument();
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent(/78,00\s€/);
  });

  it("sets the tab title while the confirmation is shown and restores it on unmount", () => {
    document.title = "Finalizar compra · Bugout";
    confirmations().save({
      orderNumber: "BUG-TITLE001",
      placedAt: "2026-09-26T10:00:00.000Z",
      email: "ana@example.es",
      lines: [{ productId: "kit", name: "Kit 24H", quantity: 1, unitPriceMinor: 3900, subtotalMinor: 3900 }],
      totals: { subtotal: eur(39), shipping: eur(4.95), tax: eur(7.63), total: eur(43.95) },
      shippingMethod: "standard",
    });
    setCart(new Cart("EUR"));
    const { unmount } = render(<CheckoutFlow provider="local" />);
    expect(document.title).toBe("Pedido confirmado · Bugout");
    unmount();
    expect(document.title).toBe("Finalizar compra · Bugout");
  });

  it("forgets the last confirmation when a new checkout starts with items", () => {
    const clear = vi.spyOn(confirmations(), "clear");
    setCart(cartWith(60));
    render(<CheckoutFlow provider="local" />);
    expect(clear).toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 2, name: "Contacto" })).toBeInTheDocument();
  });

  it("keeps the redirect message (no retry prompt) once the hosted checkout is opening", async () => {
    setCart(cartWith(60));
    mocks.checkout.mockResolvedValueOnce(true);
    render(<CheckoutFlow provider="shopify" />);
    await waitFor(() => expect(mocks.checkout).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Te estamos llevando al pago seguro…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ir al pago" })).not.toBeInTheDocument();
  });

  it("replaces /checkout in the history when handing off, so Back does not bounce into the hosted checkout", async () => {
    setCart(cartWith(60));
    mocks.checkout.mockResolvedValueOnce(true);
    render(<CheckoutFlow provider="shopify" />);
    await waitFor(() => expect(mocks.checkout).toHaveBeenCalledWith({ replace: true }));
  });

  it("offers the retry instead of an endless spinner when the page is restored from the back/forward cache", async () => {
    setCart(cartWith(60));
    mocks.checkout.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    render(<CheckoutFlow provider="shopify" />);
    await waitFor(() => expect(mocks.checkout).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("button", { name: "Ir al pago" })).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));
    });
    expect(screen.queryByRole("button", { name: "Ir al pago" })).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    });
    await userEvent.click(await screen.findByRole("button", { name: "Ir al pago" }));
    expect(mocks.checkout).toHaveBeenCalledTimes(2);
    expect(mocks.checkout).toHaveBeenLastCalledWith({ replace: true });
  });

  it("offers a retry when the hosted checkout could not start (Shopify provider, once per mount)", async () => {
    setCart(cartWith(60));
    render(
      <StrictMode>
        <CheckoutFlow provider="shopify" />
      </StrictMode>,
    );
    expect(screen.getByText("Te estamos llevando al pago seguro…")).toBeInTheDocument();
    await screen.findByRole("button", { name: "Ir al pago" });
    expect(mocks.checkout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ir al pago" }));
    expect(mocks.checkout).toHaveBeenCalledTimes(2);
  });
});
