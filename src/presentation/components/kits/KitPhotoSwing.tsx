"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/presentation/components/ui";
import type { KitCardImage } from "./photoRelief";
import { createPhotoReliefRenderer, type PhotoReliefRenderer } from "./photoReliefRenderer";

/** How far the photo turns each way, and how long a full swing (there and back) takes. */
export const SWING_DEGREES = 35;
export const SWING_SECONDS = 8;
const MAX_PIXEL_RATIO = 2;

/** Turn (radians) `seconds` into the swing: starts as photographed, then 35° each way. */
export function swingAngle(seconds: number): number {
  return ((SWING_DEGREES * Math.PI) / 180) * Math.sin((2 * Math.PI * seconds) / SWING_SECONDS);
}

export interface KitPhotoSwingProps {
  image: KitCardImage;
}

/**
 * A kit's backpack photo swinging ±35° round its vertical axis, with the depth of its relief. Decorative: the card
 * around it names the kit. The still photo shows first; once the card nears the viewport WebGL draws the same
 * photo, fades in and swings it, pausing off screen and in background tabs. Server HTML, reduced motion, no WebGL
 * and a photo that fails to load keep the still photo. It fills its parent, which sets its size and position.
 */
export function KitPhotoSwing({ image }: KitPhotoSwingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [swinging, setSwinging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === "undefined") return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const pixelRatio = () => Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    let renderer: PhotoReliefRenderer | null = null;
    let loading = false;
    let disposed = false;
    let onScreen = false;
    let frame = 0;
    let last: number | null = null;
    let elapsed = 0; // seconds of swing shown so far

    const canSwing = () =>
      renderer !== null && onScreen && !reducedMotion?.matches && document.visibilityState === "visible";

    const tick = (time: number) => {
      frame = 0;
      if (!renderer || !canSwing()) return;
      if (last !== null) elapsed += (time - last) / 1000;
      last = time;
      renderer.draw(swingAngle(elapsed));
      frame = requestAnimationFrame(tick);
    };

    const update = () => {
      if (canSwing()) {
        if (!frame) {
          last = null;
          frame = requestAnimationFrame(tick);
        }
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const start = async () => {
      if (loading || renderer || reducedMotion?.matches) return;
      loading = true;
      const photo = new window.Image();
      photo.src = image.src;
      try {
        await photo.decode();
      } catch {
        return; // keep the still photo
      }
      if (disposed) return;
      renderer = createPhotoReliefRenderer(canvas, image, photo);
      if (!renderer) return;
      renderer.resize(pixelRatio());
      renderer.draw(swingAngle(elapsed));
      setSwinging(true);
      update();
    };

    const onMotionChange = () => {
      if (reducedMotion?.matches) setSwinging(false);
      else if (renderer) setSwinging(true);
      else if (onScreen) void start();
      update();
    };

    const onContextLost = () => {
      renderer = null;
      setSwinging(false);
      update();
    };

    const visibility = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        if (onScreen) void start();
        update();
      },
      { rootMargin: "200px 0px" },
    );
    visibility.observe(canvas);
    const size =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            renderer?.resize(pixelRatio());
            if (!frame) renderer?.draw(swingAngle(elapsed));
          });
    size?.observe(canvas);
    reducedMotion?.addEventListener?.("change", onMotionChange);
    document.addEventListener("visibilitychange", update);
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      visibility.disconnect();
      size?.disconnect();
      reducedMotion?.removeEventListener?.("change", onMotionChange);
      document.removeEventListener("visibilitychange", update);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      renderer?.dispose();
    };
  }, [image]);

  return (
    <div className="relative size-full" data-swing={swinging ? "swinging" : "still"}>
      <Image
        src={image.src}
        alt=""
        width={image.width}
        height={image.height}
        unoptimized
        className={cn("absolute inset-0 size-full object-contain transition-opacity duration-300", swinging && "opacity-0")}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn("absolute inset-0 size-full transition-opacity duration-300", !swinging && "opacity-0")}
      />
    </div>
  );
}
