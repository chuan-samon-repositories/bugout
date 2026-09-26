// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getContainer } from "@/infrastructure/config";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/presentation/context/AnalyticsContext", () => ({
  useAnalytics: () => ({ track: vi.fn(), captureException: vi.fn(), setConsent: vi.fn() }),
}));

vi.mock("@/presentation/context/CartContext", () => ({
  useCart: () => ({ cart: null, addItem: vi.fn(), pending: false }),
}));

import HomePage from "./page";

const NEWSLETTER_TITLE = "Consejos de preparación en tu correo";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("home page", () => {
  it("leaves out the newsletter section while messaging is disabled", async () => {
    expect(getContainer().isMessagingSimulated()).toBe(true);
    render(await HomePage());
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: NEWSLETTER_TITLE })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suscribirme" })).not.toBeInTheDocument();
  });

  it("shows the newsletter section once messaging is enabled", async () => {
    vi.spyOn(getContainer(), "isMessagingSimulated").mockReturnValue(false);
    render(await HomePage());
    expect(screen.getByRole("region", { name: NEWSLETTER_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suscribirme" })).toBeInTheDocument();
  });
});
