// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalyticsEvent } from "@/application/analytics/events";
import { CONSENT_VERSION, type ConsentDecision } from "@/application/dtos/Consent";

/** Behaves like the real adapters: drops every event until consent is granted. */
const fakes = vi.hoisted(() => {
  const service = {
    granted: false,
    tracked: [] as string[],
    track(event: { name: string }) {
      if (service.granted) service.tracked.push(event.name);
    },
    captureException() {},
    setConsent: (granted: boolean) => {
      service.granted = granted;
    },
  };
  const repository = {
    stored: null as import("@/application/dtos/Consent").ConsentDecision | null,
    get: () => repository.stored,
    set: (decision: import("@/application/dtos/Consent").ConsentDecision) => {
      repository.stored = decision;
    },
  };
  return { service, repository };
});

vi.mock("@/infrastructure/config", () => ({
  getContainer: () => ({
    getAnalyticsService: () => fakes.service,
    getConsentRepository: () => fakes.repository,
    getSyncedStorageKeys: () => ({ cart: ["bugout.cart"], consent: "bugout.consent" }),
  }),
}));

import { AnalyticsProvider, useAnalytics, useConsent } from "./AnalyticsContext";

const viewed: AnalyticsEvent = {
  name: "product_viewed",
  properties: {
    product_id: "a",
    product_slug: "a",
    product_name: "A",
    category: "c",
    price: 1,
    currency: "EUR",
    badge: null,
    in_stock: true,
  },
};

/** Like ProductViewTracker: tracks once from a passive effect on mount. */
function ViewTracker() {
  const analytics = useAnalytics();
  useEffect(() => {
    analytics.track(viewed);
  }, [analytics]);
  return null;
}

function ConsentState() {
  const { decision } = useConsent();
  return <p>{decision === null ? "sin decisión" : decision.analytics ? "aceptado" : "rechazado"}</p>;
}

const decision = (analytics: boolean): ConsentDecision => ({
  analytics,
  decidedAt: new Date().toISOString(),
  version: CONSENT_VERSION,
});

function otherTab(key: string | null, next: ConsentDecision | null) {
  fakes.repository.stored = next;
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key }));
  });
}

beforeEach(() => {
  fakes.service.granted = false;
  fakes.service.tracked = [];
  fakes.repository.stored = null;
  vi.restoreAllMocks();
});

describe("AnalyticsProvider consent restore", () => {
  it("restores stored consent before children track on mount (full page load of a product page)", () => {
    fakes.repository.stored = decision(true);
    render(
      <AnalyticsProvider>
        <ViewTracker />
      </AnalyticsProvider>,
    );
    expect(fakes.service.tracked).toEqual(["product_viewed"]);
  });

  it("re-applies a stored grant as 'restored', not as a new visitor decision", () => {
    const setConsent = vi.spyOn(fakes.service, "setConsent");
    fakes.repository.stored = decision(true);
    render(
      <AnalyticsProvider>
        <ViewTracker />
      </AnalyticsProvider>,
    );
    expect(setConsent).toHaveBeenCalledTimes(1);
    expect(setConsent).toHaveBeenCalledWith(true, "restored");
  });

  it("tracks nothing on mount when there is no stored consent", () => {
    render(
      <AnalyticsProvider>
        <ViewTracker />
      </AnalyticsProvider>,
    );
    expect(fakes.service.tracked).toEqual([]);
  });
});

describe("AnalyticsProvider across tabs", () => {
  it("applies consent accepted and withdrawn in another tab", () => {
    const setConsent = vi.spyOn(fakes.service, "setConsent");
    render(
      <AnalyticsProvider>
        <ConsentState />
      </AnalyticsProvider>,
    );
    expect(screen.getByText("sin decisión")).toBeInTheDocument();

    otherTab("bugout.consent", decision(true));
    expect(setConsent).toHaveBeenLastCalledWith(true, "restored");
    expect(screen.getByText("aceptado")).toBeInTheDocument();

    otherTab("bugout.consent", decision(false));
    expect(setConsent).toHaveBeenLastCalledWith(false, "restored");
    expect(screen.getByText("rechazado")).toBeInTheDocument();

    otherTab(null, null);
    expect(screen.getByText("sin decisión")).toBeInTheDocument();
    expect(setConsent).toHaveBeenCalledTimes(2);
  });

  it("ignores storage events for other keys", () => {
    const setConsent = vi.spyOn(fakes.service, "setConsent");
    render(
      <AnalyticsProvider>
        <ConsentState />
      </AnalyticsProvider>,
    );
    otherTab("bugout.cart", decision(true));
    expect(setConsent).not.toHaveBeenCalled();
    expect(screen.getByText("sin decisión")).toBeInTheDocument();
  });
});
