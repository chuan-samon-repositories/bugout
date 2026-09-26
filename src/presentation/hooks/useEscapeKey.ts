import { useEffect, useRef } from 'react';

/**
 * Stack of active listeners so nested overlays (a modal inside a drawer)
 * only close the top-most one per Escape press.
 */
const stack: symbol[] = [];

/** Calls `handler` when Escape is pressed while `active` is true. */
export function useEscapeKey(handler: (event: KeyboardEvent) => void, active = true): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!active) return;
    const token = Symbol('escape-listener');
    stack.push(token);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (stack[stack.length - 1] !== token) return;
      handlerRef.current(event);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const index = stack.lastIndexOf(token);
      if (index !== -1) stack.splice(index, 1);
    };
  }, [active]);
}
