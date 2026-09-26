// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders breadcrumbs, a single h1 and the description", () => {
    render(
      <PageHeader
        title="Productos"
        description="Kits para cualquier emergencia"
        breadcrumbs={[{ label: "Inicio", href: "/" }, { label: "Productos", href: "/products" }]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Migas de pan" });
    expect(within(nav).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    const current = within(nav).getByText("Productos");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.tagName).toBe("SPAN");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Kits para cualquier emergencia")).toBeInTheDocument();
  });
});
