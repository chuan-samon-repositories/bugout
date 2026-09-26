// @vitest-environment jsdom
import { useRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getFocusableElements, useFocusTrap } from "./useFocusTrap";

function Trap({ active, empty = false }: { active: boolean; empty?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <>
      <button type="button">Fuera</button>
      <div ref={ref} data-testid="trap">
        {!empty && (
          <>
            <button type="button">Primero</button>
            <button type="button" disabled>
              Desactivado
            </button>
            <input aria-label="Medio" />
            <button type="button">Último</button>
          </>
        )}
      </div>
    </>
  );
}

describe("useFocusTrap", () => {
  it("focuses the first focusable element on activation", () => {
    render(<Trap active />);
    expect(screen.getByRole("button", { name: "Primero" })).toHaveFocus();
  });

  it("cycles Tab and Shift+Tab among focusable descendants", async () => {
    const user = userEvent.setup();
    render(<Trap active />);
    const first = screen.getByRole("button", { name: "Primero" });
    const middle = screen.getByRole("textbox", { name: "Medio" });
    const last = screen.getByRole("button", { name: "Último" });

    await user.tab();
    expect(middle).toHaveFocus();
    await user.tab();
    expect(last).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it("focuses the container when there is nothing focusable", async () => {
    const user = userEvent.setup();
    render(<Trap active empty />);
    const container = screen.getByTestId("trap");
    expect(container).toHaveFocus();
    await user.tab();
    expect(container).toHaveFocus();
  });

  it("restores focus when deactivated and does nothing while inactive", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Trap active={false} />);
    const outside = screen.getByRole("button", { name: "Fuera" });
    outside.focus();
    rerender(<Trap active />);
    expect(screen.getByRole("button", { name: "Primero" })).toHaveFocus();
    rerender(<Trap active={false} />);
    expect(outside).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Primero" })).toHaveFocus();
  });

  it("lists only enabled, tabbable elements", () => {
    render(<Trap active={false} />);
    expect(getFocusableElements(screen.getByTestId("trap")).map((el) => el.textContent || el.getAttribute("aria-label"))).toEqual([
      "Primero",
      "Medio",
      "Último",
    ]);
  });
});
