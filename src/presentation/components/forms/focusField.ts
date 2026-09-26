/** Focuses the control with this id; for a fieldset (radio group) its checked or first enabled input. */
export function focusField(id: string): boolean {
  const element = document.getElementById(id);
  if (!element) return false;
  const target =
    element instanceof HTMLFieldSetElement
      ? (element.querySelector<HTMLInputElement>("input:checked:not(:disabled)") ??
        element.querySelector<HTMLInputElement>("input:not(:disabled)"))
      : element;
  if (!target) return false;
  target.focus();
  return true;
}

/** Focuses the first of `ids` that exists in the document. */
export function focusFirstInvalidField(ids: readonly string[]): void {
  for (const id of ids) {
    if (focusField(id)) return;
  }
}
