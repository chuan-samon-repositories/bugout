// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { CONSENT_VERSION } from "@/application/dtos/Consent";
import { getContainer, resetContainer } from "@/infrastructure/config";
import { CookieSettingsButton } from "@/presentation/components/layout/CookieSettingsButton";
import { useConsent } from "@/presentation/context/AnalyticsContext";
import { ConsentBanner } from "./ConsentBanner";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function DecisionProbe() {
  const { decision, ready } = useConsent();
  return <p data-testid="decision">{ready ? String(decision?.analytics ?? "none") : "loading"}</p>;
}

function renderBanner() {
  return render(
    <Providers>
      <ConsentBanner />
      <CookieSettingsButton />
      <DecisionProbe />
    </Providers>,
  );
}

const stored = () => JSON.parse(localStorage.getItem("bugout.consent") ?? "null");

describe("ConsentBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    resetContainer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks undecided visitors with equally prominent reject and accept buttons", async () => {
    renderBanner();
    const banner = await screen.findByRole("region", { name: "Aviso de cookies" });
    expect(banner).toHaveTextContent("PostHog");
    expect(screen.getByRole("link", { name: "Más información sobre cookies" })).toHaveAttribute("href", "/cookies");
    const reject = screen.getByRole("button", { name: "Rechazar" });
    const accept = screen.getByRole("button", { name: "Aceptar" });
    expect(reject.className).toBe(accept.className);
  });

  it("is excluded from analytics autocapture, so the consent click itself is never recorded", async () => {
    renderBanner();
    expect(await screen.findByRole("region", { name: "Aviso de cookies" })).toHaveClass("ph-no-capture");
  });

  it("does not steal focus on an undecided first visit", async () => {
    renderBanner();
    await screen.findByRole("region", { name: "Aviso de cookies" });
    expect(document.body).toHaveFocus();
  });

  it("stores acceptance, enables analytics and hides the banner", async () => {
    const setConsent = vi.spyOn(getContainer().getAnalyticsService(), "setConsent");
    const user = userEvent.setup();
    renderBanner();

    await user.click(await screen.findByRole("button", { name: "Aceptar" }));

    expect(stored()).toEqual({ analytics: true, decidedAt: expect.any(String), version: CONSENT_VERSION });
    expect(setConsent).toHaveBeenCalledWith(true, "visitor");
    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).toBeNull();
    expect(screen.getByTestId("decision")).toHaveTextContent("true");
  });

  it("stores rejection and keeps analytics off", async () => {
    const setConsent = vi.spyOn(getContainer().getAnalyticsService(), "setConsent");
    const user = userEvent.setup();
    renderBanner();

    await user.click(await screen.findByRole("button", { name: "Rechazar" }));

    expect(stored()).toMatchObject({ analytics: false, version: CONSENT_VERSION });
    expect(setConsent).toHaveBeenCalledWith(false, "visitor");
    expect(setConsent).not.toHaveBeenCalledWith(true, expect.anything());
    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).toBeNull();
  });

  it("stays hidden for a stored decision and re-enables analytics that was granted", async () => {
    localStorage.setItem(
      "bugout.consent",
      JSON.stringify({ analytics: true, decidedAt: "2026-01-01T00:00:00.000Z", version: CONSENT_VERSION }),
    );
    const setConsent = vi.spyOn(getContainer().getAnalyticsService(), "setConsent");
    renderBanner();

    expect(await screen.findByTestId("decision")).toHaveTextContent("true");
    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).toBeNull();
    expect(setConsent).toHaveBeenCalledWith(true, "restored");
    expect(setConsent).not.toHaveBeenCalledWith(true, "visitor");
  });

  it("reopens from the cookie settings button so the choice can be changed", async () => {
    const user = userEvent.setup();
    renderBanner();
    await user.click(await screen.findByRole("button", { name: "Aceptar" }));

    await user.click(screen.getByRole("button", { name: "Configurar cookies" }));
    expect(screen.getByRole("region", { name: "Aviso de cookies" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Rechazar" }));
    expect(stored()).toMatchObject({ analytics: false });
    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).toBeNull();
  });

  it("moves focus into a reopened banner, and Escape closes it without changing the decision", async () => {
    const user = userEvent.setup();
    renderBanner();
    await user.click(await screen.findByRole("button", { name: "Aceptar" }));
    const before = stored();
    const settings = screen.getByRole("button", { name: "Configurar cookies" });

    await user.click(settings);
    expect(screen.getByRole("region", { name: "Aviso de cookies" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechazar" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).toBeNull();
    expect(settings).toHaveFocus();
    expect(stored()).toEqual(before);
    expect(screen.getByTestId("decision")).toHaveTextContent("true");
  });

  it("returns focus to the reopening control after a new choice", async () => {
    const user = userEvent.setup();
    renderBanner();
    await user.click(await screen.findByRole("button", { name: "Rechazar" }));
    const settings = screen.getByRole("button", { name: "Configurar cookies" });
    await user.click(settings);
    await user.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(stored()).toMatchObject({ analytics: true });
    expect(settings).toHaveFocus();
  });

  it("ignores Escape on an undecided first visit (the banner stays until a choice is made)", async () => {
    const user = userEvent.setup();
    renderBanner();
    await screen.findByRole("region", { name: "Aviso de cookies" });
    await user.tab();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("region", { name: "Aviso de cookies" })).toBeInTheDocument();
    expect(stored()).toBeNull();
  });

  it("reserves its height at the end of the page so it never permanently covers content", async () => {
    let callback: ResizeObserverCallback = () => {};
    class FakeResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        callback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    let height = 120;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ height, width: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect,
    );
    try {
      renderBanner();
      const banner = await screen.findByRole("region", { name: "Aviso de cookies" });
      const spacer = banner.previousElementSibling as HTMLElement;
      expect(spacer).toHaveAttribute("aria-hidden", "true");
      expect(spacer.style.height).toBe("120px");

      height = 180;
      act(() => callback([], {} as ResizeObserver));
      expect(spacer.style.height).toBe("180px");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
