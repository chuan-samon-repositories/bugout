import { cn } from "./cn";

export interface FrogMascotProps {
  className?: string;
}

/**
 * The Bugout frog breathing: the 8-frame pixel-art strip played with steps(8)
 * (see `.frog-breathe` in globals.css). Decorative; static under reduced motion.
 * Size it with `[--frog-size:…]`, e.g. `[--frog-size:140px] md:[--frog-size:240px]`.
 */
export function FrogMascot({ className }: FrogMascotProps) {
  return <div aria-hidden="true" className={cn("frog-breathe", className)} />;
}
