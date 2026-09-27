// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "./Reveal";

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;
let observed: Callback | null = null;

class FakeObserver {
  constructor(callback: Callback) {
    observed = callback;
  }
  observe() {}
  disconnect() {}
}

function mockMotion(reduced: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: reduced, addEventListener() {}, removeEventListener() {} }),
  );
}

function placeBelowTheFold() {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 5000 } as DOMRect);
}

describe("Reveal", () => {
  beforeEach(() => {
    observed = null;
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    mockMotion(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("hides content below the fold until it scrolls into view", () => {
    placeBelowTheFold();
    render(<Reveal delay={90}>Contenido</Reveal>);
    const element = screen.getByText("Contenido");
    expect(element).toHaveAttribute("data-reveal", "hidden");
    expect(element.style.getPropertyValue("--reveal-delay")).toBe("90ms");

    act(() => observed?.([{ isIntersecting: true }]));
    expect(element).toHaveAttribute("data-reveal", "shown");
  });

  it("never hides content already on screen", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 10 } as DOMRect);
    render(<Reveal>Arriba</Reveal>);
    expect(screen.getByText("Arriba")).not.toHaveAttribute("data-reveal");
  });

  it("does nothing when the visitor prefers reduced motion", () => {
    mockMotion(true);
    placeBelowTheFold();
    render(<Reveal>Quieto</Reveal>);
    expect(screen.getByText("Quieto")).not.toHaveAttribute("data-reveal");
  });

  it("keeps content visible without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    placeBelowTheFold();
    render(<Reveal as="section">Sin observador</Reveal>);
    const element = screen.getByText("Sin observador");
    expect(element.tagName).toBe("SECTION");
    expect(element).not.toHaveAttribute("data-reveal");
  });
});
