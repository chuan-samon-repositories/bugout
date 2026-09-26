// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalPage } from "./LegalPage";

describe("LegalPage", () => {
  it("renders a single h1, breadcrumbs, the update date and the content", () => {
    render(
      <LegalPage title="Política de cookies" updatedAt="2026-09-26">
        <h2>Qué son las cookies</h2>
      </LegalPage>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Política de cookies");
    const nav = screen.getByRole("navigation", { name: "Migas de pan" });
    expect(within(nav).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    const time = screen.getByText("26 de septiembre de 2026");
    expect(time).toHaveAttribute("dateTime", "2026-09-26");
    expect(time.parentElement).toHaveTextContent("Última actualización: 26 de septiembre de 2026");
    expect(screen.getByRole("heading", { level: 2, name: "Qué son las cookies" })).toBeInTheDocument();
  });
});
