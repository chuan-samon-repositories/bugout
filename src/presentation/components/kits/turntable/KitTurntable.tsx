"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/presentation/components/ui";
import { TURNTABLE_MODELS, type TurntableModelId } from "./models";
import { createTurntableRenderer, type TurntableRenderer } from "./renderer";

/** Seconds per full turn. */
export const SECONDS_PER_TURN = 14;
const MAX_PIXEL_RATIO = 2;

export interface KitTurntableProps {
  model: TurntableModelId;
}

/**
 * A product turning in 3D. Decorative: the card around it names the product. It shows the poster (the model at
 * its start angle) until the card nears the viewport; then WebGL draws the model from that same angle, fades in
 * and turns it, pausing off screen and in background tabs. Server HTML, reduced motion, no WebGL and a texture
 * that fails to load keep the poster. It fills its parent, which sets its size and position.
 */
export function KitTurntable({ model: id }: KitTurntableProps) {
  const model = TURNTABLE_MODELS[id];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [turning, setTurning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === "undefined") return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const pixelRatio = () => Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    let renderer: TurntableRenderer | null = null;
    let loading = false;
    let disposed = false;
    let onScreen = false;
    let frame = 0;
    let last: number | null = null;
    let angle = (model.shape.startAngle * Math.PI) / 180;

    const canTurn = () =>
      renderer !== null && onScreen && !reducedMotion?.matches && document.visibilityState === "visible";

    const tick = (time: number) => {
      frame = 0;
      if (!renderer || !canTurn()) return;
      if (last !== null) angle += ((time - last) / 1000) * ((2 * Math.PI) / SECONDS_PER_TURN);
      last = time;
      renderer.draw(angle);
      frame = requestAnimationFrame(tick);
    };

    const update = () => {
      if (canTurn()) {
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
      const texture = new window.Image();
      texture.src = model.texture;
      try {
        await texture.decode();
      } catch {
        return; // keep the poster
      }
      if (disposed) return;
      renderer = createTurntableRenderer(canvas, model.shape, texture);
      if (!renderer) return;
      renderer.resize(pixelRatio());
      renderer.draw(angle);
      setTurning(true);
      update();
    };

    const onMotionChange = () => {
      if (reducedMotion?.matches) setTurning(false);
      else if (renderer) setTurning(true);
      else if (onScreen) void start();
      update();
    };

    const onContextLost = () => {
      renderer = null;
      setTurning(false);
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
    const size = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
      renderer?.resize(pixelRatio());
      if (!frame) renderer?.draw(angle);
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
  }, [model]);

  return (
    <div className="relative size-full" aria-hidden="true" data-turntable={turning ? "turning" : "poster"}>
      <Image
        src={model.poster.src}
        alt=""
        width={model.poster.width}
        height={model.poster.height}
        unoptimized
        className={cn(
          "absolute inset-0 size-full object-contain transition-opacity duration-500",
          turning && "opacity-0",
        )}
      />
      <canvas
        ref={canvasRef}
        className={cn("absolute inset-0 size-full transition-opacity duration-500", !turning && "opacity-0")}
      />
    </div>
  );
}
