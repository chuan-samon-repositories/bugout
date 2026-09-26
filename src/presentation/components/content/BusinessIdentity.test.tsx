// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const site = vi.hoisted(() => ({
  siteConfig: {
    name: "Bugout",
    contactEmail: null as string | null,
    legal: { name: null as string | null, taxId: null as string | null, address: null as string | null },
  },
}));

vi.mock("@/presentation/config/site", () => site);

import { BusinessIdentity } from "./BusinessIdentity";

describe("BusinessIdentity", () => {
  beforeEach(() => {
    site.siteConfig.contactEmail = null;
    site.siteConfig.legal = { name: null, taxId: null, address: null };
  });

  it("renders nothing when no identity field is configured", () => {
    const { container } = render(<BusinessIdentity />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the fallback when no identity field is configured", () => {
    render(<BusinessIdentity fallback={<p>Usa el formulario de contacto</p>} />);
    expect(screen.getByText("Usa el formulario de contacto")).toBeInTheDocument();
  });

  it("renders only the configured fields", () => {
    site.siteConfig.legal = { name: "Bugout Equipamiento S.L.", taxId: null, address: "Calle Mayor 1, 28013 Madrid" };
    site.siteConfig.contactEmail = "hola@example.es";
    render(<BusinessIdentity fallback={<p>Usa el formulario de contacto</p>} />);

    expect(screen.getByText("Titular")).toBeInTheDocument();
    expect(screen.getByText("Bugout Equipamiento S.L.")).toBeInTheDocument();
    expect(screen.getByText("Domicilio")).toBeInTheDocument();
    expect(screen.getByText("Calle Mayor 1, 28013 Madrid")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hola@example.es" })).toHaveAttribute("href", "mailto:hola@example.es");
    expect(screen.queryByText("NIF")).not.toBeInTheDocument();
    expect(screen.queryByText("Usa el formulario de contacto")).not.toBeInTheDocument();
  });
});
