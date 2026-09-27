// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KitTurntable, SECONDS_PER_TURN } from "./KitTurntable";
import { TURNTABLE_MODELS } from "./models";

const { createRenderer, renderer } = vi.hoisted(() => ({
  createRenderer: vi.fn(),
  renderer: { resize: vi.fn(), draw: vi.fn(), dispose: vi.fn() },
}));
vi.mock("./renderer", () => ({ createTurntableRenderer: createRenderer }));

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
let scrolled: ObserverCallback | null = null;
class FakeIntersectionObserver {
  constructor(callback: ObserverCallback) {
    scrolled = callback;
  }
  observe() {}
  disconnect() {}
}

let decodes = true;
class FakeImage {
  src = "";
  decode() {
    return decodes ? Promise.resolve() : Promise.reject(new Error("broken"));
  }
}

let frames: Array<FrameRequestCallback | null> = [];
let reduced = false;
let motionListener: (() => void) | null = null;

const model = TURNTABLE_MODELS["mochila-30l"];
const startAngle = (model.shape.startAngle * Math.PI) / 180;

async function scrollIntoView(onScreen = true) {
  await act(async () => scrolled?.([{ isIntersecting: onScreen }]));
}

function runFrame(time: number) {
  const pending = frames;
  frames = [];
  act(() => pending.forEach((frame) => frame?.(time)));
}

const state = (container: HTMLElement) => container.querySelector("[data-turntable]")?.getAttribute("data-turntable");

describe("KitTurntable", () => {
  beforeEach(() => {
    scrolled = null;
    decodes = true;
    frames = [];
    reduced = false;
    motionListener = null;
    createRenderer.mockReset().mockReturnValue(renderer);
    Object.values(renderer).forEach((fn) => fn.mockReset());
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback));
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      frames[id - 1] = null;
    });
    vi.stubGlobal("matchMedia", () => ({
      get matches() {
        return reduced;
      },
      addEventListener: (_: string, listener: () => void) => (motionListener = listener),
      removeEventListener: () => (motionListener = null),
    }));
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows the poster, hidden from assistive technology, until it nears the viewport", () => {
    const { container } = render(<KitTurntable model="mochila-30l" />);
    const poster = container.querySelector("img");
    expect(poster).toHaveAttribute("alt", "");
    expect(poster).toHaveAttribute("src", model.poster.src);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(state(container)).toBe("poster");
    expect(createRenderer).not.toHaveBeenCalled();
  });

  it("draws the model from the poster's angle, then turns it", async () => {
    const { container } = render(<KitTurntable model="mochila-30l" />);
    await scrollIntoView();

    expect(createRenderer).toHaveBeenCalledWith(container.querySelector("canvas"), model.shape, expect.any(FakeImage));
    expect(createRenderer.mock.calls[0][2].src).toBe(model.texture);
    expect(renderer.resize).toHaveBeenCalled();
    expect(renderer.draw).toHaveBeenLastCalledWith(startAngle);
    expect(state(container)).toBe("turning");

    runFrame(1000);
    runFrame(2000);
    expect(renderer.draw).toHaveBeenLastCalledWith(expect.closeTo(startAngle + (2 * Math.PI) / SECONDS_PER_TURN, 9));
  });

  it("pauses off screen", async () => {
    render(<KitTurntable model="mochila-30l" />);
    await scrollIntoView();
    await scrollIntoView(false);
    runFrame(1000);
    expect(renderer.draw).toHaveBeenCalledTimes(1);
  });

  it("keeps the poster when the visitor prefers reduced motion", async () => {
    reduced = true;
    const { container } = render(<KitTurntable model="mochila-30l" />);
    await scrollIntoView();
    expect(createRenderer).not.toHaveBeenCalled();
    expect(state(container)).toBe("poster");
  });

  it("goes back to the poster when reduced motion is switched on", async () => {
    const { container } = render(<KitTurntable model="mochila-30l" />);
    await scrollIntoView();
    reduced = true;
    act(() => motionListener?.());
    runFrame(1000);
    expect(state(container)).toBe("poster");
    expect(renderer.draw).toHaveBeenCalledTimes(1);
  });

  it("keeps the poster without WebGL", async () => {
    createRenderer.mockReturnValue(null);
    const { container } = render(<KitTurntable model="mochila-30l" />);
    await scrollIntoView();
    expect(createRenderer).toHaveBeenCalledTimes(1);
    expect(state(container)).toBe("poster");
  });

  it("keeps the poster when the texture does not load", async () => {
    decodes = false;
    const { container } = render(<KitTurntable model="mochila-30l" />);
    await scrollIntoView();
    expect(createRenderer).not.toHaveBeenCalled();
    expect(state(container)).toBe("poster");
  });

  it("releases WebGL when it unmounts", async () => {
    const { unmount } = render(<KitTurntable model="mochila-30l" />);
    await scrollIntoView();
    unmount();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
  });
});
