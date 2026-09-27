// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Cart, MAX_QUANTITY_PER_ITEM } from "@/domain/entities/cart/Cart";
import { buildProduct } from "@/domain/testing/buildProduct";
import { Quantity } from "@/domain/value-objects/Quantity";
import { Drawer } from "@/presentation/components/ui";
import { AddToCart } from "./AddToCart";
import { toProductSnapshot } from "./productSnapshot";

const cartState = vi.hoisted(() => ({
  cart: null as Cart | null,
  addItem: vi.fn<(product: unknown, quantity: number) => Promise<boolean>>(),
  pending: false,
}));

vi.mock("@/presentation/context/CartContext", () => ({
  useCart: () => cartState,
}));

const product = buildProduct({ id: "kit-24h", name: "Mochila 24H", price: 199 });
const snapshot = toProductSnapshot(product);

/** Stands in for the cart drawer, which CartContext opens while addItem is still running. */
let openDrawer: () => void = () => {};
function WithCartDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  openDrawer = () => setOpen(true);
  return (
    <>
      {children}
      <Drawer open={open} onClose={() => setOpen(false)} title="Tu carrito">
        <p>Contenido</p>
      </Drawer>
    </>
  );
}

function cartWith(quantity: number): Cart {
  const cart = new Cart("EUR");
  cart.addItem(product, new Quantity(quantity));
  return cart;
}

describe("AddToCart", () => {
  beforeEach(() => {
    cartState.cart = null;
    cartState.pending = false;
    cartState.addItem.mockReset();
    cartState.addItem.mockResolvedValue(true);
  });

  it("adds the chosen quantity and resets it to 1 on success", async () => {
    const user = userEvent.setup();
    render(<AddToCart product={snapshot} />);

    const input = screen.getByLabelText("Cantidad");
    expect(input).toHaveValue(1);
    expect(screen.getByRole("button", { name: "Reducir cantidad" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    await user.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    expect(input).toHaveValue(3);

    await user.click(screen.getByRole("button", { name: "Añadir al carrito" }));
    expect(cartState.addItem).toHaveBeenCalledTimes(1);
    const [added, quantity] = cartState.addItem.mock.calls[0];
    expect((added as typeof product).slug).toBe("kit-24h");
    expect(quantity).toBe(3);
    expect(input).toHaveValue(1);
  });

  it("keeps the quantity when adding fails", async () => {
    cartState.addItem.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<AddToCart product={snapshot} />);
    const input = screen.getByLabelText("Cantidad");
    await user.clear(input);
    await user.type(input, "4");
    await user.click(screen.getByRole("button", { name: "Añadir al carrito" }));
    expect(cartState.addItem).toHaveBeenCalledWith(expect.anything(), 4);
    expect(input).toHaveValue(4);
  });

  it("limits the quantity to what still fits in the cart", async () => {
    cartState.cart = cartWith(MAX_QUANTITY_PER_ITEM - 2);
    const user = userEvent.setup();
    render(<AddToCart product={snapshot} />);

    const input = screen.getByLabelText("Cantidad");
    expect(input).toHaveAttribute("max", "2");
    const increase = screen.getByRole("button", { name: "Aumentar cantidad" });
    await user.click(increase);
    expect(input).toHaveValue(2);
    expect(increase).toBeDisabled();

    await user.clear(input);
    await user.type(input, "50");
    await user.click(screen.getByRole("button", { name: "Añadir al carrito" }));
    expect(cartState.addItem).toHaveBeenCalledWith(expect.anything(), 2);
  });

  it("stays focusable while adding, so the cart drawer returns focus to it on Escape", async () => {
    let finish: (added: boolean) => void = () => {};
    cartState.addItem.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    const user = userEvent.setup();
    render(
      <WithCartDrawer>
        <AddToCart product={snapshot} />
      </WithCartDrawer>,
    );
    const button = screen.getByRole("button", { name: "Añadir al carrito" });
    await user.click(button);

    // Loading: busy and inert, but still focused (a disabled button would drop focus to <body>).
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    await user.click(button);
    expect(cartState.addItem).toHaveBeenCalledTimes(1);

    act(() => openDrawer());
    await act(async () => finish(true));
    const dialog = screen.getByRole("dialog", { name: "Tu carrito" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(button).toHaveFocus();
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("explains when the cart already holds the maximum", () => {
    cartState.cart = cartWith(MAX_QUANTITY_PER_ITEM);
    render(<AddToCart product={snapshot} />);
    expect(screen.getByText("Ya tienes el máximo de unidades en el carrito")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Añadir al carrito" })).toBeDisabled();
    expect(screen.queryByLabelText("Cantidad")).toBeNull();
  });

  it("is disabled for out-of-stock products", () => {
    render(<AddToCart product={toProductSnapshot(buildProduct({ inStock: false }))} />);
    expect(screen.getByRole("button", { name: "Agotado" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Añadir al carrito" })).toBeNull();
  });
});
