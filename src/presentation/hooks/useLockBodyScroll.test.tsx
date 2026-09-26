// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLockBodyScroll } from "./useLockBodyScroll";

describe("useLockBodyScroll", () => {
  it("locks while active and restores the original styles", () => {
    document.body.style.overflow = "auto";
    const { rerender, unmount } = renderHook(({ active }) => useLockBodyScroll(active), {
      initialProps: { active: true },
    });
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");
    rerender({ active: false });
    expect(document.body.style.overflow).toBe("auto");
    expect(document.documentElement.style.overflow).toBe("");
    unmount();
    document.body.style.overflow = "";
  });

  it("keeps the lock until the last nested user releases it", () => {
    const outer = renderHook(() => useLockBodyScroll(true));
    const inner = renderHook(() => useLockBodyScroll(true));
    inner.unmount();
    expect(document.body.style.overflow).toBe("hidden");
    outer.unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
