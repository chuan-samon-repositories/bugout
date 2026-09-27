"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

export interface RevealProps {
  children: ReactNode;
  /** Element to render; defaults to a div. */
  as?: ElementType;
  /** Delay in ms, for staggering siblings (e.g. index × 90). */
  delay?: number;
  className?: string;
  id?: string;
}

type RevealState = "hidden" | "shown";

/**
 * Fades its content up when it scrolls into view. Content is only hidden after
 * mount, when it starts below the fold, motion is allowed and IntersectionObserver
 * exists: server HTML, no-JS visitors, reduced motion and anything already on
 * screen always show the content straight away.
 */
export function Reveal({ children, as: Component = "div", delay = 0, className, id }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<RevealState | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    setState("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState("shown");
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style = delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined;
  return (
    <Component ref={ref} id={id} className={className} data-reveal={state ?? undefined} style={style}>
      {children}
    </Component>
  );
}
