import { useEffect } from 'react';

interface SavedStyles {
  htmlOverflow: string;
  bodyOverflow: string;
  bodyPaddingRight: string;
}

/** Number of active locks; styles are applied on the first and restored on the last. */
let lockCount = 0;
let saved: SavedStyles | null = null;

function lock(): void {
  lockCount += 1;
  if (lockCount > 1) return;

  const html = document.documentElement;
  const body = document.body;
  saved = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    bodyPaddingRight: body.style.paddingRight,
  };

  // Compensate for the disappearing scrollbar so the layout does not shift.
  const scrollbarWidth = window.innerWidth - html.clientWidth;
  if (scrollbarWidth > 0) {
    const currentPadding = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
  }
  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
}

function unlock(): void {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0 || !saved) return;

  document.documentElement.style.overflow = saved.htmlOverflow;
  document.body.style.overflow = saved.bodyOverflow;
  document.body.style.paddingRight = saved.bodyPaddingRight;
  saved = null;
}

/** Prevents page scrolling while `active` is true. Nested locks are reference-counted. */
export function useLockBodyScroll(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
