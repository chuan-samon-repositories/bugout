// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getContainer } from "@/infrastructure/config";
import { NewsletterForm } from "./NewsletterForm";

const analytics = vi.hoisted(() => ({
  track: vi.fn(),
  identify: vi.fn(),
  captureException: vi.fn(),
  setConsent: vi.fn(),
}));

vi.mock("@/presentation/context/AnalyticsContext", () => ({ useAnalytics: () => analytics }));

vi.mock("@/infrastructure/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/config")>();
  const container = actual.createContainer({ provider: "local", posthog: null, simulatedDelayMs: 0 });
  return { ...actual, getContainer: () => container };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("NewsletterForm", () => {
  it("shows an inline Spanish error for an invalid email and tracks nothing", async () => {
    render(<NewsletterForm location="home" />);
    const input = screen.getByRole("textbox", { name: "Correo electrónico" });
    await userEvent.type(input, "ana@correo");
    await userEvent.click(screen.getByRole("button", { name: "Suscribirme" }));

    expect(await screen.findByText(/Introduce un correo electrónico válido/)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveFocus();
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it("replaces the form with a confirmation and tracks the subscription", async () => {
    render(<NewsletterForm location="footer" tone="dark" />);
    await userEvent.type(screen.getByRole("textbox", { name: "Correo electrónico" }), "ana@example.es");
    await userEvent.click(screen.getByRole("button", { name: "Suscribirme" }));

    expect(await screen.findByText("¡Gracias! Te hemos apuntado a la lista.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suscribirme" })).not.toBeInTheDocument();
    expect(screen.queryByText(/correo de bienvenida/i)).not.toBeInTheDocument();
    expect(analytics.track).toHaveBeenCalledWith({ name: "newsletter_subscribed", properties: { location: "footer" } });
  });

  it("keeps the label for screen readers in the compact footer variant and links the privacy policy", () => {
    render(<NewsletterForm location="footer" />);
    expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toHaveAttribute("autocomplete", "email");
    expect(screen.getByRole("link", { name: "política de privacidad" })).toHaveAttribute("href", "/privacy");
  });

  it("shows a generic error when the subscription fails", async () => {
    vi.spyOn(getContainer().getSubscribeNewsletterUseCase(), "execute").mockRejectedValueOnce(new Error("offline"));
    render(<NewsletterForm location="home" />);
    await userEvent.type(screen.getByRole("textbox", { name: "Correo electrónico" }), "ana@example.es");
    await userEvent.click(screen.getByRole("button", { name: "Suscribirme" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Algo ha salido mal. Inténtalo de nuevo.");
    expect(screen.queryByText("¡Gracias! Te hemos apuntado a la lista.")).not.toBeInTheDocument();
    expect(analytics.track).not.toHaveBeenCalled();
  });
});
