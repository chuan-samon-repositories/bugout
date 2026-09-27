// Bugout: Shopify custom pixel for the hosted checkout's steps. Paste this whole file into Shopify admin →
// Settings → Customer events → Add custom pixel ("Bugout PostHog"), with Customer privacy → Permission:
// "Required" and Data sale: "Data collected does not qualify as data sale". See docs/ANALYTICS.md.
//
// It sends the checkout funnel to PostHog under the same anonymous id the site uses, which the site writes onto
// the cart as the `_ph_distinct_id` attribute only when the visitor accepted analytics. Without that attribute
// (no consent on the site) it sends nothing. The order itself is recorded by the site's webhook
// (src/app/api/shopify/webhooks), not here. Event names mirror src/application/analytics/events.ts.
// Keep POSTHOG_KEY equal to the site's NEXT_PUBLIC_POSTHOG_KEY (a public project key).

const POSTHOG_KEY = "phc_Ti9LSXK59iAHtxd5ZUgTrNgzrGwSRCfAHwQlqtLS0o";
const POSTHOG_HOST = "https://eu.i.posthog.com";
const DISTINCT_ID_ATTRIBUTE = "_ph_distinct_id";
const SESSION_ID_ATTRIBUTE = "_ph_session_id";

const STEPS = {
  checkout_contact_info_submitted: [1, "contact"],
  checkout_address_info_submitted: [2, "address"],
  checkout_shipping_info_submitted: [3, "shipping"],
  payment_info_submitted: [4, "payment"],
};

/** Ids of the visit that started this checkout (alerts carry no checkout data, so they reuse them). */
let visit = null;

function attribute(checkout, key) {
  const found = ((checkout && checkout.attributes) || []).find((item) => item && item.key === key);
  return found && typeof found.value === "string" && found.value ? found.value : null;
}

function rememberVisit(checkout) {
  const distinctId = attribute(checkout, DISTINCT_ID_ATTRIBUTE);
  if (distinctId) visit = { distinctId, sessionId: attribute(checkout, SESSION_ID_ATTRIBUTE) };
}

function cartProperties(checkout) {
  const lines = (checkout && checkout.lineItems) || [];
  return {
    cart_value: Number((checkout && checkout.subtotalPrice && checkout.subtotalPrice.amount) || 0),
    cart_item_count: lines.reduce((count, line) => count + (Number(line && line.quantity) || 0), 0),
    currency: (checkout && checkout.currencyCode) || "EUR",
  };
}

function send(name, timestamp, properties) {
  if (!visit) return;
  const payload = {
    api_key: POSTHOG_KEY,
    event: name,
    distinct_id: visit.distinctId,
    timestamp,
    properties: Object.assign({}, properties, {
      checkout_type: "hosted",
      commerce_provider: "shopify",
      $process_person_profile: false,
      $lib: "bugout-shopify-pixel",
    }, visit.sessionId ? { $session_id: visit.sessionId } : {}),
  };
  fetch(POSTHOG_HOST + "/i/v0/e/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

analytics.subscribe("checkout_started", (event) => {
  rememberVisit(event.data && event.data.checkout);
});

Object.keys(STEPS).forEach((name) => {
  analytics.subscribe(name, (event) => {
    const checkout = event.data && event.data.checkout;
    rememberVisit(checkout);
    const [step, stepName] = STEPS[name];
    send("checkout_step_completed", event.timestamp, Object.assign({ step, step_name: stepName }, cartProperties(checkout)));
  });
});

analytics.subscribe("alert_displayed", (event) => {
  const alert = (event.data && event.data.alert) || {};
  // Only the kind of alert and the field it concerns: never its message, which may repeat what the buyer typed.
  send("checkout_alert_displayed", event.timestamp, {
    alert_type: String(alert.type || "unknown"),
    alert_target: String(alert.target || "unknown"),
  });
});
