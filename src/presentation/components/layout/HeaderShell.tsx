"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/presentation/components/ui/cn";
import { routes } from "@/presentation/routes";

/** Scroll distance after which the header over the home hero turns solid. */
export const SOLID_AFTER_PX = 40;

function useScrollState() {
  const [state, setState] = useState({ scrolled: false, progress: 0 });
  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setState({
        scrolled: window.scrollY > SOLID_AFTER_PX,
        progress: scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0,
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return state;
}

/**
 * The fixed header bar. Transparent over the home hero until the visitor scrolls,
 * solid navy with a blur everywhere else. Also draws the orange reading-progress bar.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { scrolled, progress } = useScrollState();
  const transparent = pathname === routes.home && !scrolled;

  return (
    <header
      data-transparent={transparent || undefined}
      className={cn(
        "fixed inset-x-0 top-0 z-40 h-(--header-height) text-sand",
        "transition-[background-color,box-shadow,backdrop-filter] duration-350 ease-brand",
        transparent
          ? "bg-transparent"
          : "bg-navy-darker/90 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.4)] backdrop-blur-lg backdrop-saturate-150",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] origin-left bg-orange"
        style={{ transform: `scaleX(${progress})` }}
      />
      {children}
    </header>
  );
}
