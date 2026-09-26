// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
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

  it("stores acceptance, enables analytics and hides the banner", async () => {
    const setConsent = vi.spyOn(getContainer().getAnalyticsService(), "setConsent");
    const user = userEvent.setup();
    renderBanner();

    await user.click(await screen.findByRole("button", { name: "Aceptar" }));

    expect(stored()).toEqual({ analytics: true, decidedAt: expect.any(String), version: CONSENT_VERSION });
    expect(setConsent).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).toBeNull();
    expect(screen.getByTestId("decision")).toHaveTextContent("true");
  });

  it("stores rejection and keeps analytics off", async () => {
    const setConsent = vi.spyOn(getContainer().getAnalyticsService(), "setConsent");
    const user = userEvent.setup();
    renderBanner();

    await user.click(await screen.findByRole("button", { name: "Rechazar" }));

    expect(stored()).toMatchObject({ analytics: false, version: CONSENT_VERSION });
    expect(setConsent).toHaveBeenCalledWith(false);
    expect(setConsent).not.toHaveBeenCalledWith(true);
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
    expect(setConsent).toHaveBeenCalledWith(true);
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
});
