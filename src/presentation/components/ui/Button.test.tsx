// @vitest-environment jsdom
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, ButtonLink, IconButton } from "./Button";
import { PlusIcon } from "./icons";

describe("Button", () => {
  it("defaults to type=button and forwards props and ref", async () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} onClick={onClick} data-testid="btn">
        Añadir
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Añadir" });
    expect(button).toHaveAttribute("type", "button");
    expect(ref.current).toBe(button);
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables, sets aria-busy and shows a spinner while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Pagar
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Pagar" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("svg.animate-spin")).not.toBeNull();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("respects disabled without aria-busy", () => {
    render(<Button disabled>Enviar</Button>);
    const button = screen.getByRole("button", { name: "Enviar" });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("applies variant and width classes", () => {
    render(
      <Button variant="secondary" fullWidth>
        Ver
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Ver" });
    expect(button.className).toContain("border-navy");
    expect(button.className).toContain("w-full");
    expect(button.className).toContain("focus-visible:ring-accent");
  });
});

describe("ButtonLink", () => {
  it("renders a link with button styles", () => {
    render(<ButtonLink href="/products">Ver productos</ButtonLink>);
    const link = screen.getByRole("link", { name: "Ver productos" });
    expect(link).toHaveAttribute("href", "/products");
    expect(link.className).toContain("bg-orange");
  });
});

describe("IconButton", () => {
  it("uses the label as its accessible name and hides the icon", () => {
    render(
      <IconButton label="Aumentar cantidad">
        <PlusIcon />
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "Aumentar cantidad" });
    expect(button).toHaveAttribute("aria-label", "Aumentar cantidad");
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("size-11");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
