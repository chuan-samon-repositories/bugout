// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_VERSION } from "@/application/dtos/Consent";
import { getContainer, resetContainer } from "@/infrastructure/config";
import { AnalyticsProvider, useAnalytics, useConsent } from "./AnalyticsContext";

describe("AnalyticsProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    resetContainer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws clear errors outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAnalytics())).toThrow(/AnalyticsProvider/);
    expect(() => renderHook(() => useConsent())).toThrow(/AnalyticsProvider/);
  });

  it("exposes the container's analytics service", () => {
    const { result } = renderHook(() => useAnalytics(), { wrapper: AnalyticsProvider });
    expect(result.current).toBe(getContainer().getAnalyticsService());
  });

  it("becomes ready without a decision and opens the banner", async () => {
    const { result } = renderHook(() => useConsent(), { wrapper: AnalyticsProvider });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.decision).toBeNull();
    expect(result.current.isBannerOpen).toBe(true);
    expect(result.current.reopenRequest).toBe(0);
  });

  it("records a decision and can reopen the banner without forgetting it", async () => {
    const setConsent = vi.spyOn(getContainer().getAnalyticsService(), "setConsent");
    const { result } = renderHook(() => useConsent(), { wrapper: AnalyticsProvider });
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => result.current.reject());
    expect(result.current.decision).toMatchObject({ analytics: false, version: CONSENT_VERSION });
    expect(result.current.isBannerOpen).toBe(false);
    expect(setConsent).toHaveBeenLastCalledWith(false, "visitor");

    act(() => result.current.reopen());
    expect(result.current.isBannerOpen).toBe(true);
    expect(result.current.reopenRequest).toBe(1);
    expect(result.current.decision?.analytics).toBe(false);

    act(() => result.current.dismiss());
    expect(result.current.isBannerOpen).toBe(false);
    expect(result.current.reopenRequest).toBe(0);
    expect(result.current.decision?.analytics).toBe(false);

    act(() => result.current.reopen());

    act(() => result.current.accept());
    expect(getContainer().getConsentRepository().get()?.analytics).toBe(true);
    expect(setConsent).toHaveBeenLastCalledWith(true, "visitor");
    expect(result.current.isBannerOpen).toBe(false);
  });
});
