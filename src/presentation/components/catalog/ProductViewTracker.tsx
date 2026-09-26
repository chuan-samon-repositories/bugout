"use client";

import { useEffect, useRef } from "react";
import { useAnalytics } from "@/presentation/context/AnalyticsContext";
import type { ProductViewedProperties } from "./productAnalytics";

/** Sends `product_viewed` once per mounted product page. Renders nothing. */
export function ProductViewTracker({ properties }: { properties: ProductViewedProperties }) {
  const analytics = useAnalytics();
  const trackedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (trackedSlug.current === properties.product_slug) return;
    trackedSlug.current = properties.product_slug;
    analytics.track({ name: "product_viewed", properties });
  }, [analytics, properties]);

  return null;
}
