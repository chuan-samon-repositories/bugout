import posthog from "posthog-js";

// Initialize PostHog client
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST!,
  capture_pageview: "history_change",
  // capture_pageleave: true, // Enable pageleave capture
  // capture_exceptions: true, // Enable error tracking
  // debug: process.env.NODE_ENV === "development",
});
