import posthog from "posthog-js";

// Initialize PostHog client
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "https://eu.i.posthog.com",
  capture_pageview: "history_change",
  // capture_pageleave: true, // Enable pageleave capture
  // capture_exceptions: true, // Enable error tracking
  // debug: process.env.NODE_ENV === "development",
});
