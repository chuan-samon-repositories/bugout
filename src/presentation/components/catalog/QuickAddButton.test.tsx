// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { Drawer } from "@/presentation/components/ui";
import { toProductSnapshot } from "./productSnapshot";
import { QuickAddButton } from "./QuickAddButton";

const cart = vi.hoisted(() => ({
  addItem: vi.fn<(product: unknown, quantity: number, source: string) => Promise<boolean>>(),
  pending: false,
}));

vi.mock("@/presentation/context/CartContext", () => ({
  useCart: () => cart,
}));

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

const snapshot = toProductSnapshot(buildProduct({ id: "silbato", name: "Silbato", price: 5 }));

describe("QuickAddButton", () => {
  beforeEach(() => {
    cart.pending = false;
    cart.addItem.mockReset();
  });

  it("adds one unit from the product card", async () => {
    cart.addItem.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<QuickAddButton product={snapshot} />);
    await user.click(screen.getByRole("button", { name: "Añadir Silbato al carrito" }));
    expect(cart.addItem).toHaveBeenCalledWith(expect.objectContaining({ slug: "silbato" }), 1, "product_card");
  });

  it("stays focusable while adding, so the cart drawer returns focus to it on Escape", async () => {
    let finish: (added: boolean) => void = () => {};
    cart.addItem.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    const user = userEvent.setup();
    render(
      <WithCartDrawer>
        <QuickAddButton product={snapshot} />
      </WithCartDrawer>,
    );
    const button = screen.getByRole("button", { name: "Añadir Silbato al carrito" });
    await user.click(button);

    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    await user.click(button);
    expect(cart.addItem).toHaveBeenCalledTimes(1);

    act(() => openDrawer());
    await act(async () => finish(true));
    expect(screen.getByRole("dialog", { name: "Tu carrito" })).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(button).toHaveFocus();
  });

  it("is disabled while another cart change is pending", () => {
    cart.pending = true;
    render(<QuickAddButton product={snapshot} />);
    expect(screen.getByRole("button", { name: "Añadir Silbato al carrito" })).toBeDisabled();
  });
});
