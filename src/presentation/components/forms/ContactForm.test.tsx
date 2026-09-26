// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getContainer } from "@/infrastructure/config";
import ContactPage from "@/app/contact/page";
import { ContactForm } from "./ContactForm";
import { isContactTopic } from "./contactTopics";

const analytics = vi.hoisted(() => ({
  track: vi.fn(),
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

async function fillValidMessage() {
  await userEvent.type(screen.getByRole("textbox", { name: "Nombre" }), "Ana García");
  await userEvent.type(screen.getByRole("textbox", { name: "Correo electrónico" }), "ana@example.es");
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Tema" }), "order");
  await userEvent.type(screen.getByRole("textbox", { name: "Asunto" }), "Pedido BUG-123");
  await userEvent.type(screen.getByRole("textbox", { name: "Mensaje" }), "¿Cuándo llegará mi pedido?");
  await userEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
}

describe("ContactForm", () => {
  it("maps field errors to Spanish copy, lists them and focuses the first invalid field", async () => {
    render(<ContactForm />);
    await userEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    const name = screen.getByRole("textbox", { name: "Nombre" });
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("Este campo es obligatorio.");

    const summary = screen.getByText("Revisa los siguientes 4 campos:").closest("div") as HTMLElement;
    const links = within(summary).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "#contact-name",
      "#contact-email",
      "#contact-subject",
      "#contact-message",
    ]);
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it("reports a too-short message with the minimum length", async () => {
    render(<ContactForm />);
    await userEvent.type(screen.getByRole("textbox", { name: "Nombre" }), "Ana");
    await userEvent.type(screen.getByRole("textbox", { name: "Correo electrónico" }), "ana@example.es");
    await userEvent.type(screen.getByRole("textbox", { name: "Asunto" }), "Duda");
    await userEvent.type(screen.getByRole("textbox", { name: "Mensaje" }), "Hola");
    await userEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    const message = screen.getByRole("textbox", { name: "Mensaje" });
    expect(message).toHaveFocus();
    expect(message).toHaveAccessibleDescription(/Escribe al menos 10 caracteres\./);
    expect(screen.getByText("4 / 2000 caracteres")).toBeInTheDocument();
  });

  it("says it is a demo while messaging is simulated and does not claim the message was sent", async () => {
    render(<ContactForm />);
    expect(
      screen.getByText("Modo demostración: este formulario todavía no envía los datos a ninguna parte."),
    ).toBeInTheDocument();
    await fillValidMessage();

    expect(await screen.findByText("Recibido. En modo demostración el mensaje no se envía a nadie.")).toBeInTheDocument();
    expect(screen.queryByText(/Mensaje enviado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Te responderemos/)).not.toBeInTheDocument();
  });

  it("sends the message, shows the success panel, tracks the topic and resets once messaging is connected", async () => {
    vi.spyOn(getContainer(), "isMessagingSimulated").mockReturnValue(false);
    render(<ContactForm />);
    expect(screen.queryByText(/Modo demostración/)).not.toBeInTheDocument();
    await fillValidMessage();

    expect(await screen.findByText("Te responderemos lo antes posible.")).toBeInTheDocument();
    // Title and body must not repeat each other.
    expect(screen.getAllByText(/Mensaje enviado/)).toHaveLength(1);
    expect(analytics.track).toHaveBeenCalledWith({ name: "contact_message_sent", properties: { topic: "order" } });

    await userEvent.click(screen.getByRole("button", { name: "Enviar otro mensaje" }));
    const name = screen.getByRole("textbox", { name: "Nombre" });
    expect(name).toHaveValue("");
    expect(name).toHaveFocus();
  });

  it("preselects the initial topic", () => {
    render(<ContactForm initialTopic="wholesale" />);
    expect(screen.getByRole("combobox", { name: "Tema" })).toHaveValue("wholesale");
  });
});

describe("isContactTopic", () => {
  it("accepts only known topics", () => {
    expect(["general", "order", "product", "wholesale"].every(isContactTopic)).toBe(true);
    for (const value of ["", "Order", "billing", undefined, ["order"]]) {
      expect(isContactTopic(value)).toBe(false);
    }
  });
});

describe("ContactPage", () => {
  it("preselects a valid ?topic= and ignores invalid ones", async () => {
    const { unmount } = render(await ContactPage({ searchParams: Promise.resolve({ topic: "order" }) }));
    expect(screen.getByRole("combobox", { name: "Tema" })).toHaveValue("order");
    unmount();

    render(await ContactPage({ searchParams: Promise.resolve({ topic: "hackers" }) }));
    expect(screen.getByRole("combobox", { name: "Tema" })).toHaveValue("general");
  });

  it("shows honest help: returns window, Spain-only shipping and no invented contact details", async () => {
    render(await ContactPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("heading", { level: 1, name: "Contacto" })).toBeInTheDocument();
    expect(screen.getByText("Tienes 30 días desde la entrega para devolver tu pedido.")).toBeInTheDocument();
    expect(screen.getByText("Enviamos a la España peninsular y a las islas Baleares.")).toBeInTheDocument();
    expect(screen.getByText(/Envío estándar gratis a partir de 75,00\s€/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /@/ })).not.toBeInTheDocument();
    expect(screen.getByText("¿Hacéis pedidos para empresas o grupos?")).toBeInTheDocument();
    expect(screen.queryByText(/Te responderemos por correo/)).not.toBeInTheDocument();
  });

  it("only promises an email reply to wholesale enquiries once messaging is connected", async () => {
    vi.spyOn(getContainer(), "isMessagingSimulated").mockReturnValue(false);
    render(await ContactPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/Te responderemos por correo/)).toBeInTheDocument();
    expect(screen.queryByText(/Modo demostración/)).not.toBeInTheDocument();
  });
});
