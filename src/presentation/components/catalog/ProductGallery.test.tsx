// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { messages } from "@/presentation/i18n";
import { GALLERY_INTERVAL_MS, ProductGallery } from "./ProductGallery";
import { toProductSnapshot } from "./productSnapshot";

const copy = messages.catalog.product;

const images = [1, 2, 3].map((n) => ({ url: `/images/products/foto-${n}.jpg`, alt: `Foto ${n}` }));
const snapshot = toProductSnapshot(buildProduct({ id: "radio-solar", images }));

let reduced = false;
let motionListener: (() => void) | null = null;

/** Number (1-based) of the image the gallery shows, read from the pressed thumbnail. */
function shown(): number {
  const pressed = screen.getAllByRole("button", { pressed: true });
  expect(pressed).toHaveLength(1);
  return Number(pressed[0].getAttribute("aria-label")?.match(/\d+/)?.[0]);
}

function thumbnail(n: number) {
  return screen.getByRole("button", { name: copy.showImage(n) });
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("ProductGallery", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reduced = false;
    motionListener = null;
    vi.stubGlobal("matchMedia", () => ({
      get matches() {
        return reduced;
      },
      addEventListener: (_: string, listener: () => void) => {
        motionListener = listener;
      },
      removeEventListener: () => {},
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("moves on to the next image every GALLERY_INTERVAL_MS and wraps around", () => {
    render(<ProductGallery product={snapshot} />);
    expect(shown()).toBe(1);
    advance(GALLERY_INTERVAL_MS - 1);
    expect(shown()).toBe(1);
    advance(1);
    expect(shown()).toBe(2);
    advance(GALLERY_INTERVAL_MS);
    expect(shown()).toBe(3);
    advance(GALLERY_INTERVAL_MS);
    expect(shown()).toBe(1);
  });

  it("shows a thumbnail's image when the mouse points at it, but not on touch", () => {
    render(<ProductGallery product={snapshot} />);
    fireEvent.pointerOver(thumbnail(3), { pointerType: "touch" });
    expect(shown()).toBe(1);
    fireEvent.pointerOver(thumbnail(3), { pointerType: "mouse" });
    expect(shown()).toBe(3);
  });

  it("shows a thumbnail's image when clicked, and gives it a full interval", () => {
    render(<ProductGallery product={snapshot} />);
    advance(GALLERY_INTERVAL_MS - 1000);
    fireEvent.click(thumbnail(3));
    expect(shown()).toBe(3);
    advance(GALLERY_INTERVAL_MS - 1);
    expect(shown()).toBe(3);
    advance(1);
    expect(shown()).toBe(1);
  });

  it("stops while the mouse is over the gallery and starts again when it leaves", () => {
    const { container } = render(<ProductGallery product={snapshot} />);
    const gallery = container.firstElementChild as HTMLElement;
    fireEvent.pointerOver(gallery, { pointerType: "mouse" });
    advance(GALLERY_INTERVAL_MS * 3);
    expect(shown()).toBe(1);
    fireEvent.pointerOut(gallery, { pointerType: "mouse", relatedTarget: document.body });
    advance(GALLERY_INTERVAL_MS);
    expect(shown()).toBe(2);
  });

  it("has a pause button that stops and resumes it", () => {
    render(<ProductGallery product={snapshot} />);
    fireEvent.click(screen.getByRole("button", { name: copy.pauseGallery }));
    advance(GALLERY_INTERVAL_MS * 3);
    expect(shown()).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: copy.playGallery }));
    advance(GALLERY_INTERVAL_MS);
    expect(shown()).toBe(2);
  });

  it("stays still, without a pause button, under reduced motion", () => {
    reduced = true;
    render(<ProductGallery product={snapshot} />);
    expect(screen.queryByRole("button", { name: copy.pauseGallery })).toBeNull();
    advance(GALLERY_INTERVAL_MS * 3);
    expect(shown()).toBe(1);
  });

  it("stops when the visitor turns on reduced motion", () => {
    render(<ProductGallery product={snapshot} />);
    reduced = true;
    act(() => motionListener?.());
    advance(GALLERY_INTERVAL_MS * 3);
    expect(shown()).toBe(1);
  });

  it("does not move with a single image", () => {
    render(<ProductGallery product={toProductSnapshot(buildProduct({ images: images.slice(0, 1) }))} />);
    expect(screen.queryByRole("button", { name: copy.pauseGallery })).toBeNull();
    advance(GALLERY_INTERVAL_MS * 3);
    expect(shown()).toBe(1);
  });
});
