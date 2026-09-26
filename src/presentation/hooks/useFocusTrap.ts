import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Keyboard-focusable descendants of `container`, in DOM order. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.hasAttribute('disabled') &&
      !element.closest('[hidden], [inert], [aria-hidden="true"]'),
  );
}

export interface FocusTrapOptions {
  /** Element to focus on activation instead of the first focusable descendant. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Return focus to the element that was focused before activation (default true). */
  restoreFocus?: boolean;
}

function focusContainer(container: HTMLElement): void {
  if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
  container.focus();
}

/**
 * Keeps keyboard focus inside `ref` while `active`: moves focus in on activation,
 * cycles Tab / Shift+Tab among focusable descendants, and restores focus on deactivation.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  options: FocusTrapOptions = {},
): void {
  const { initialFocusRef, restoreFocus = true } = options;

  useEffect(() => {
    const container = ref.current;
    if (!active || !container) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!container.contains(document.activeElement)) {
      const initial = initialFocusRef?.current ?? getFocusableElements(container)[0];
      if (initial) initial.focus();
      else focusContainer(container);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        focusContainer(container);
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      const outside = !container.contains(current);

      if (event.shiftKey && (current === first || current === container || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (restoreFocus && previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [ref, active, initialFocusRef, restoreFocus]);
}
