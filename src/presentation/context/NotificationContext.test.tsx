// @vitest-environment jsdom
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationProvider, useNotifications, type NotifyOptions } from "./NotificationContext";

function Trigger({ options }: { options: NotifyOptions }) {
  const { notify } = useNotifications();
  return (
    <button type="button" onClick={() => notify(options)}>
      Notificar
    </button>
  );
}

function renderWith(options: NotifyOptions) {
  render(
    <NotificationProvider>
      <Trigger options={options} />
    </NotificationProvider>,
  );
  return () => fireEvent.click(screen.getByRole("button", { name: "Notificar" }));
}

describe("NotificationProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws a clear error outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useNotifications())).toThrow(/NotificationProvider/);
    spy.mockRestore();
  });

  it("shows success toasts in the polite live region", () => {
    const notify = renderWith({ tone: "success", title: "Añadido", message: "Kit 72H en tu carrito" });
    notify();
    const message = screen.getByText("Kit 72H en tu carrito");
    expect(screen.getByText("Añadido")).toBeInTheDocument();
    expect(message.closest("[aria-live='polite']")).not.toBeNull();
    expect(screen.getByRole("region", { name: "Notificaciones" })).toContainElement(message);
  });

  it("puts errors in the alert region", () => {
    const notify = renderWith({ tone: "error", message: "No se pudo añadir" });
    notify();
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo añadir");
  });

  it("auto-dismisses after the default duration", () => {
    vi.useFakeTimers();
    const notify = renderWith({ tone: "info", message: "Hola" });
    notify();
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByText("Hola")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Hola")).toBeNull();
  });

  it("keeps errors longer and honours durationMs", () => {
    vi.useFakeTimers();
    const notify = renderWith({ tone: "error", message: "Fallo" });
    notify();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText("Fallo")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText("Fallo")).toBeNull();
  });

  it("pauses while hovered", () => {
    vi.useFakeTimers();
    const notify = renderWith({ tone: "info", message: "Pausa", durationMs: 1000 });
    notify();
    const toast = screen.getByText("Pausa").closest("[data-notification-tone]") as HTMLElement;
    act(() => vi.advanceTimersByTime(600));
    fireEvent.mouseEnter(toast);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText("Pausa")).toBeInTheDocument();
    fireEvent.mouseLeave(toast);
    act(() => vi.advanceTimersByTime(399));
    expect(screen.getByText("Pausa")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Pausa")).toBeNull();
  });

  it("dismisses from the close button", () => {
    const notify = renderWith({ tone: "success", message: "Guardado" });
    notify();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar notificación" }));
    expect(screen.queryByText("Guardado")).toBeNull();
  });

  it("runs the action and dismisses", () => {
    const onClick = vi.fn();
    const notify = renderWith({ tone: "info", message: "Deshacer", action: { label: "Deshacer cambio", onClick } });
    notify();
    fireEvent.click(screen.getByRole("button", { name: "Deshacer cambio" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Deshacer")).toBeNull();
  });

  it("shows at most three notifications", () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: NotificationProvider });
    act(() => {
      for (const n of [1, 2, 3, 4]) result.current.notify({ tone: "info", message: `Aviso ${n}` });
    });
    expect(screen.queryByText("Aviso 1")).toBeNull();
    expect(screen.getAllByText(/Aviso [234]/)).toHaveLength(3);
  });
});
