// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KitPhotoSwing, SWING_DEGREES, SWING_SECONDS, swingAngle } from "./KitPhotoSwing";
import { KIT_CARD_IMAGES } from "./kitCardPhotos.generated";

const { createRenderer, renderer } = vi.hoisted(() => ({
  createRenderer: vi.fn(),
  renderer: { resize: vi.fn(), draw: vi.fn(), dispose: vi.fn() },
}));
vi.mock("./photoReliefRenderer", () => ({ createPhotoReliefRenderer: createRenderer }));

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

const image = KIT_CARD_IMAGES["kit-72h"];

async function scrollIntoView(onScreen = true) {
  await act(async () => scrolled?.([{ isIntersecting: onScreen }]));
}

function runFrame(time: number) {
  const pending = frames;
  frames = [];
  act(() => pending.forEach((frame) => frame?.(time)));
}

const state = (container: HTMLElement) => container.querySelector("[data-swing]")?.getAttribute("data-swing");

describe("swingAngle", () => {
  it("starts as photographed and swings 35° each way", () => {
    const max = (SWING_DEGREES * Math.PI) / 180;
    expect(swingAngle(0)).toBe(0);
    expect(swingAngle(SWING_SECONDS / 4)).toBeCloseTo(max, 9);
    expect(swingAngle((3 * SWING_SECONDS) / 4)).toBeCloseTo(-max, 9);
  });
});

describe("KitPhotoSwing", () => {
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

  it("shows the still photo, as decoration, until it nears the viewport", () => {
    const { container } = render(<KitPhotoSwing image={image} />);
    const photo = container.querySelector("img");
    expect(photo).toHaveAttribute("alt", "");
    expect(photo).toHaveAttribute("src", image.src);
    expect(state(container)).toBe("still");
    expect(createRenderer).not.toHaveBeenCalled();
  });

  it("draws the photo as photographed, then swings it", async () => {
    const { container } = render(<KitPhotoSwing image={image} />);
    await scrollIntoView();

    expect(createRenderer).toHaveBeenCalledWith(container.querySelector("canvas"), image, expect.any(FakeImage));
    expect(createRenderer.mock.calls[0][2].src).toBe(image.src);
    expect(renderer.resize).toHaveBeenCalled();
    expect(renderer.draw).toHaveBeenLastCalledWith(0);
    expect(state(container)).toBe("swinging");

    runFrame(1000);
    runFrame(1000 + (SWING_SECONDS * 1000) / 4);
    expect(renderer.draw).toHaveBeenLastCalledWith(expect.closeTo((SWING_DEGREES * Math.PI) / 180, 9));
  });

  it("pauses off screen", async () => {
    render(<KitPhotoSwing image={image} />);
    await scrollIntoView();
    await scrollIntoView(false);
    runFrame(1000);
    expect(renderer.draw).toHaveBeenCalledTimes(1);
  });

  it("keeps the still photo when the visitor prefers reduced motion", async () => {
    reduced = true;
    const { container } = render(<KitPhotoSwing image={image} />);
    await scrollIntoView();
    expect(createRenderer).not.toHaveBeenCalled();
    expect(state(container)).toBe("still");
  });

  it("goes back to the still photo when reduced motion is switched on", async () => {
    const { container } = render(<KitPhotoSwing image={image} />);
    await scrollIntoView();
    reduced = true;
    act(() => motionListener?.());
    runFrame(1000);
    expect(state(container)).toBe("still");
    expect(renderer.draw).toHaveBeenCalledTimes(1);
  });

  it("keeps the still photo without WebGL", async () => {
    createRenderer.mockReturnValue(null);
    const { container } = render(<KitPhotoSwing image={image} />);
    await scrollIntoView();
    expect(createRenderer).toHaveBeenCalledTimes(1);
    expect(state(container)).toBe("still");
  });

  it("keeps the still photo when the photo does not load", async () => {
    decodes = false;
    const { container } = render(<KitPhotoSwing image={image} />);
    await scrollIntoView();
    expect(createRenderer).not.toHaveBeenCalled();
    expect(state(container)).toBe("still");
  });

  it("releases WebGL when it unmounts", async () => {
    const { unmount } = render(<KitPhotoSwing image={image} />);
    await scrollIntoView();
    unmount();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
  });
});
