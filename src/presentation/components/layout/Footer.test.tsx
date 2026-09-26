// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { resetContainer } from "@/infrastructure/config";
import { CopyrightNotice } from "./CopyrightNotice";
import { Footer } from "./Footer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const shopColumn = () => screen.getByRole("heading", { level: 2, name: "Tienda" }).parentElement!;

describe("Footer", () => {
  beforeEach(() => {
    localStorage.clear();
    resetContainer();
  });

  it("lists the catalog's categories in the shop column", () => {
    render(
      <Providers>
        <Footer categories={[{ slug: "camping-gear", label: "Camping" }]} />
      </Providers>,
    );
    const links = within(shopColumn()).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Todos los productos", "/products"],
      ["Camping", "/products?category=camping-gear"],
      ["Ofertas", "/products?sale=1"],
    ]);
  });
});

describe("CopyrightNotice", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves a stale prerendered year to the current one", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2031-01-02T10:00:00Z"));
    render(<CopyrightNotice renderedYear={2026} />);
    expect(screen.getByText("© 2031 Bugout. Todos los derechos reservados.")).toBeInTheDocument();
  });

  it("hydrates a build-time year without a mismatch and then shows the current year", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<CopyrightNotice renderedYear={2026} />);
    document.body.append(container);
    expect(container).toHaveTextContent("© 2026");

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2031-01-02T10:00:00Z"));
    const onRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const root = await act(async () => hydrateRoot(container, <CopyrightNotice renderedYear={2026} />, { onRecoverableError }));

    expect(container).toHaveTextContent("© 2031 Bugout. Todos los derechos reservados.");
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    act(() => root.unmount());
    consoleError.mockRestore();
    container.remove();
  });
});
