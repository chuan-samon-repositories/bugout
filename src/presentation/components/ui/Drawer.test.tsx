// @vitest-environment jsdom
import Link from "next/link";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Drawer } from "./Drawer";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir carrito
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Tu carrito" footer={<button type="button">Pagar</button>}>
        <Link href="/products">Seguir comprando</Link>
      </Drawer>
    </>
  );
}

async function openDrawer() {
  const user = userEvent.setup();
  render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Abrir carrito" });
  await user.click(trigger);
  return { user, trigger, dialog: screen.getByRole("dialog", { name: "Tu carrito" }) };
}

describe("Drawer", () => {
  it("renders nothing while closed", () => {
    render(<Harness />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens as a labelled modal dialog in a portal and moves focus inside", async () => {
    const { dialog } = await openDrawer();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
  });

  it("locks body scroll while open", async () => {
    const { user } = await openDrawer();
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const { user, trigger } = await openDrawer();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("closes from the close button", async () => {
    const { user, trigger } = await openDrawer();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("closes when the backdrop is clicked", async () => {
    const { user } = await openDrawer();
    const backdrop = document.querySelector("[data-drawer-backdrop]");
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as Element);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps Tab focus inside the panel", async () => {
    const { user } = await openDrawer();
    const close = screen.getByRole("button", { name: "Cerrar" });
    await user.tab();
    expect(screen.getByRole("link", { name: "Seguir comprando" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Pagar" })).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Pagar" })).toHaveFocus();
  });
});
