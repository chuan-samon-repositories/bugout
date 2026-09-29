"use client";

import { useEffect, useMemo, useState, type FocusEvent, type PointerEvent } from "react";
import { cn, focusRing, IconButton, PauseIcon, PlayIcon } from "@/presentation/components/ui";
import { messages } from "@/presentation/i18n";
import { ProductImage } from "./ProductImage";
import { fromProductSnapshot, type ProductSnapshot } from "./productSnapshot";

/** How long each image stays before the gallery moves on to the next one. */
export const GALLERY_INTERVAL_MS = 7000;

const copy = messages.catalog.product;

/** Keyboard focus (not the focus a mouse click leaves behind), so clicking a thumbnail does not stop the gallery. */
function isKeyboardFocus(target: EventTarget): boolean {
  try {
    return target instanceof Element && target.matches(":focus-visible");
  } catch {
    return true;
  }
}

export interface ProductGalleryProps {
  product: ProductSnapshot;
}

/**
 * Main product image with thumbnail buttons; use only when the product has more than one image. Pointing at a
 * thumbnail (or clicking it) shows its image, and the gallery moves on to the next image every
 * GALLERY_INTERVAL_MS by itself. It stops while the mouse is over the gallery or keyboard focus is in it, in
 * background tabs, under reduced motion (which also hides the pause button), and while the visitor has paused it.
 */
export function ProductGallery({ product: snapshot }: ProductGalleryProps) {
  const product = useMemo(() => fromProductSnapshot(snapshot), [snapshot]);
  const count = product.images.length;
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  // False on the server and until mount: the gallery only starts moving once the browser says motion is fine.
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => setMotionAllowed(!reducedMotion?.matches);
    const onVisibilityChange = () => setVisible(document.visibilityState === "visible");
    onMotionChange();
    onVisibilityChange();
    reducedMotion?.addEventListener?.("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      reducedMotion?.removeEventListener?.("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const autoplay = count > 1 && motionAllowed;
  const running = autoplay && !paused && !hovered && !focused && visible;

  // Keyed on `selected`, so an image the visitor picks also gets its full interval.
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setSelected((current) => (current + 1) % count), GALLERY_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [running, selected, count]);

  const onPointerHover = (isOver: boolean) => (event: PointerEvent) => {
    if (event.pointerType === "mouse") setHovered(isOver);
  };
  const onFocus = (event: FocusEvent) => {
    if (isKeyboardFocus(event.target)) setFocused(true);
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  };

  return (
    <div
      className="flex min-w-0 flex-col gap-4"
      onPointerEnter={onPointerHover(true)}
      onPointerLeave={onPointerHover(false)}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-navy">
        <ProductImage
          product={product}
          index={selected}
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority={selected === 0}
        />
        {autoplay && (
          <span className="absolute right-3 bottom-3 rounded-full bg-navy-deep/80">
            <IconButton
              variant="inverse"
              label={paused ? copy.playGallery : copy.pauseGallery}
              onClick={() => setPaused((current) => !current)}
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </IconButton>
          </span>
        )}
      </div>
      <ul aria-label={copy.gallery} className="flex flex-wrap gap-3">
        {product.images.map((image, index) => (
          <li key={`${image.url}-${index}`}>
            <button
              type="button"
              aria-label={copy.showImage(index + 1)}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setSelected(index);
              }}
              className={cn(
                "relative block size-20 overflow-hidden rounded-lg border-2 bg-navy",
                selected === index ? "border-accent" : "border-transparent hover:border-navy",
                focusRing,
              )}
            >
              <ProductImage product={product} index={index} sizes="80px" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
