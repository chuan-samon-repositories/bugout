// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const consent = vi.hoisted(() => ({
  reopen: vi.fn(),
  accept: vi.fn(),
  reject: vi.fn(),
}));

vi.mock("@/presentation/context/AnalyticsContext", () => ({
  useConsent: () => ({ decision: null, ready: true, ...consent }),
}));

import { ManageCookiesButton } from "./ManageCookiesButton";

describe("ManageCookiesButton", () => {
  it("reopens the consent banner", async () => {
    render(<ManageCookiesButton />);
    const button = screen.getByRole("button", { name: "Cambiar preferencias de cookies" });
    expect(button).toHaveAttribute("type", "button");

    await userEvent.click(button);

    expect(consent.reopen).toHaveBeenCalledTimes(1);
    expect(consent.reopen).toHaveBeenCalledWith(button);
    expect(consent.accept).not.toHaveBeenCalled();
    expect(consent.reject).not.toHaveBeenCalled();
  });
});
