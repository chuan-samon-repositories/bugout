// @vitest-environment jsdom
import { fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEscapeKey } from "./useEscapeKey";

describe("useEscapeKey", () => {
  it("calls the handler on Escape only while active", () => {
    const handler = vi.fn();
    const { rerender } = renderHook(({ active }) => useEscapeKey(handler, active), {
      initialProps: { active: true },
    });
    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handler).toHaveBeenCalledTimes(1);
    rerender({ active: false });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("only notifies the most recently activated listener", () => {
    const outer = vi.fn();
    const inner = vi.fn();
    renderHook(() => useEscapeKey(outer, true));
    const innerHook = renderHook(() => useEscapeKey(inner, true));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
    innerHook.unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(outer).toHaveBeenCalledTimes(1);
  });
});
