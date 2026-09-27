#!/usr/bin/env node
// Sets up the Bugout PostHog project: project settings (time zone, currency, revenue, test-traffic filter,
// volume-heavy features off) and the dashboards described in docs/ANALYTICS.md. Idempotent: dashboards are
// found by name and their insights by name, then updated in place, so re-running applies changes.
//
//   POSTHOG_PERSONAL_API_KEY=phx_... node scripts/posthog/setup.mjs --project <id> [--host https://eu.posthog.com]
//   ... --check   only runs every insight's query against the project (changes nothing)
//
// The personal API key needs project read/write, dashboard and insight write scopes. Never commit it.

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};

const HOST = (option("host", process.env.POSTHOG_HOST) ?? "https://eu.posthog.com").replace(/\/+$/, "");
const PROJECT = option("project", process.env.POSTHOG_PROJECT_ID);
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
if (!KEY || !PROJECT) {
  console.error("Usage: POSTHOG_PERSONAL_API_KEY=phx_... node scripts/posthog/setup.mjs --project <id>");
  process.exit(1);
}

async function api(method, path, body) {
  const response = await fetch(`${HOST}/api/projects/${PROJECT}${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path} → ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

// ---------------------------------------------------------------------------------------------------------
// Query builders
// ---------------------------------------------------------------------------------------------------------

const LAST_30_DAYS = { date_from: "-30d" };
const EURO = { aggregationAxisPostfix: " €", decimalPlaces: 2 };

/** An events series. `math`: total (default), sum (with `property`), unique_session, dau. */
const series = (event, { math, property, name, properties } = {}) => ({
  kind: "EventsNode",
  event,
  name: name ?? event,
  ...(math ? { math } : {}),
  ...(property ? { math_property: property } : {}),
  ...(properties ? { properties } : {}),
});

const eventFilter = (key, value, operator = "exact") => ({ key, value, operator, type: "event" });

const trends = (seriesList, { display = "ActionsLineGraph", interval = "day", breakdown, formula, filter = {}, dateRange = LAST_30_DAYS } = {}) => ({
  kind: "InsightVizNode",
  source: {
    kind: "TrendsQuery",
    series: seriesList,
    interval,
    dateRange,
    filterTestAccounts: true,
    trendsFilter: { display, ...(formula ? { formula } : {}), ...filter },
    ...(breakdown ? { breakdownFilter: breakdown } : {}),
  },
});

const funnel = (steps, { breakdown, windowDays = 7 } = {}) => ({
  kind: "InsightVizNode",
  source: {
    kind: "FunnelsQuery",
    series: steps,
    dateRange: LAST_30_DAYS,
    filterTestAccounts: true,
    funnelsFilter: { funnelWindowInterval: windowDays, funnelWindowIntervalUnit: "day", funnelVizType: "steps" },
    ...(breakdown ? { breakdownFilter: breakdown } : {}),
  },
});

/** A HogQL table. `{filters}` in the query applies the date range and the test-traffic filter. */
const sql = (query, { testFilter = true, dateRange = LAST_30_DAYS } = {}) => ({
  kind: "DataVisualizationNode",
  source: { kind: "HogQLQuery", query, filters: { dateRange, filterTestAccounts: testFilter } },
  display: "ActionsTable",
});

const byEvent = (property) => ({ breakdown: property, breakdown_type: "event" });
const bySession = (property) => ({ breakdown: property, breakdown_type: "session" });

// Checkout steps: the local demo sends contact/shipping/review, the Shopify pixel contact/address/shipping/payment.
const step = (name) => series("checkout_step_completed", { name: `checkout: ${name}`, properties: [eventFilter("step_name", [name])] });

// ---------------------------------------------------------------------------------------------------------
// Dashboards
// ---------------------------------------------------------------------------------------------------------

const DASHBOARDS = [
  {
    name: "Bugout · Sales",
    description:
      "Orders and revenue from Shopify webhooks (order_completed, order_refunded, order_cancelled). Revenue is the order total incl. shipping and 21 % IVA. Test orders and test-site traffic are excluded.",
    insights: [
      {
        name: "Revenue (30 days)",
        query: trends([series("order_completed", { math: "sum", property: "revenue" })], { display: "BoldNumber", filter: EURO }),
      },
      { name: "Orders (30 days)", query: trends([series("order_completed")], { display: "BoldNumber" }) },
      {
        name: "Average order value (30 days)",
        query: trends([series("order_completed", { math: "sum", property: "revenue" }), series("order_completed")], {
          display: "BoldNumber",
          formula: "A / B",
          filter: EURO,
        }),
      },
      {
        name: "Net revenue after refunds (30 days)",
        query: trends(
          [series("order_completed", { math: "sum", property: "revenue" }), series("order_refunded", { math: "sum", property: "refund_amount" })],
          { display: "BoldNumber", formula: "A - B", filter: EURO },
        ),
      },
      {
        name: "Revenue and refunds per day",
        query: trends(
          [series("order_completed", { math: "sum", property: "revenue", name: "Revenue" }), series("order_refunded", { math: "sum", property: "refund_amount", name: "Refunds" })],
          { display: "ActionsBar", filter: EURO },
        ),
      },
      { name: "Orders per day", query: trends([series("order_completed")], { display: "ActionsBar" }) },
      {
        name: "Session conversion rate (%)",
        description: "Sessions with an order ÷ sessions, among visitors who accepted analytics.",
        query: trends([series("order_completed", { math: "unique_session" }), series("$pageview", { math: "unique_session" })], {
          formula: "A / B * 100",
          filter: { aggregationAxisPostfix: " %", decimalPlaces: 2 },
        }),
      },
      {
        name: "Top products sold",
        query: sql(`SELECT
    JSONExtractString(line, 'product_name') AS product,
    JSONExtractString(line, 'variant_title') AS variant,
    sum(JSONExtractInt(line, 'quantity')) AS units,
    round(sum(JSONExtractFloat(line, 'price') * JSONExtractInt(line, 'quantity')), 2) AS revenue_eur
FROM events
ARRAY JOIN JSONExtractArrayRaw(ifNull(properties.products, '[]')) AS line
WHERE event = 'order_completed' AND {filters}
GROUP BY product, variant
ORDER BY revenue_eur DESC
LIMIT 25`),
      },
      {
        name: "Discount codes used",
        query: sql(`SELECT
    JSONExtractString(code) AS discount_code,
    count() AS orders,
    round(sum(toFloat(properties.discount)), 2) AS discount_eur
FROM events
ARRAY JOIN JSONExtractArrayRaw(ifNull(properties.discount_codes, '[]')) AS code
WHERE event = 'order_completed' AND {filters}
GROUP BY discount_code
ORDER BY orders DESC`),
      },
      {
        name: "Orders by shipping method",
        query: trends([series("order_completed")], { display: "ActionsPie", breakdown: byEvent("shipping_method") }),
      },
      {
        name: "Cancellations by reason",
        query: trends([series("order_cancelled")], { display: "ActionsTable", breakdown: byEvent("reason") }),
      },
    ],
  },
  {
    name: "Bugout · Purchase funnel",
    description:
      "From landing to paid order, across the site, Shopify's hosted checkout (custom pixel) and the order webhook, joined by the anonymous visitor id. Only visitors who accepted analytics.",
    insights: [
      {
        name: "Purchase funnel",
        query: funnel([
          series("$pageview"),
          series("product_viewed"),
          series("product_added_to_cart"),
          series("checkout_started"),
          step("contact"),
          step("payment"),
          series("order_completed"),
        ]),
      },
      {
        name: "Purchase funnel by device",
        query: funnel([series("product_viewed"), series("product_added_to_cart"), series("checkout_started"), series("order_completed")], {
          breakdown: byEvent("$device_type"),
        }),
      },
      {
        name: "Hosted checkout steps",
        query: funnel([series("checkout_started"), step("contact"), step("address"), step("shipping"), step("payment"), series("order_completed")], {
          windowDays: 1,
        }),
      },
      {
        name: "Cart → checkout → order per day",
        query: trends(
          [series("product_added_to_cart", { math: "unique_session" }), series("checkout_started", { math: "unique_session" }), series("order_completed", { math: "unique_session" })],
          { display: "ActionsLineGraph" },
        ),
      },
      {
        name: "Checkout errors shown by Shopify",
        query: trends([series("checkout_alert_displayed")], { display: "ActionsTable", breakdown: byEvent("alert_target") }),
      },
      {
        name: "Checkout hand-off failures",
        query: trends([series("checkout_failed"), series("checkout_started")], { display: "ActionsLineGraph" }),
      },
    ],
  },
  {
    name: "Bugout · Acquisition & Google Ads",
    description:
      "Where visitors and orders come from. Channel and entry campaign are PostHog session properties; order attribution comes from the UTM and Google Ads click ids (gclid, gbraid, wbraid) the site writes onto the cart at checkout.",
    insights: [
      {
        name: "Sessions by channel",
        query: trends([series("$pageview", { math: "unique_session" })], { display: "ActionsBar", breakdown: bySession("$channel_type") }),
      },
      {
        name: "Orders and revenue by channel",
        query: sql(`SELECT
    session.$channel_type AS channel,
    count() AS orders,
    round(sum(toFloat(properties.revenue)), 2) AS revenue_eur
FROM events
WHERE event = 'order_completed' AND {filters}
GROUP BY channel
ORDER BY revenue_eur DESC`),
      },
      {
        name: "Orders and revenue by campaign (UTM)",
        query: sql(`SELECT
    ifNull(properties.utm_source, '(none)') AS source,
    ifNull(properties.utm_medium, '(none)') AS medium,
    ifNull(properties.utm_campaign, '(none)') AS campaign,
    count() AS orders,
    round(sum(toFloat(properties.revenue)), 2) AS revenue_eur
FROM events
WHERE event = 'order_completed' AND {filters}
GROUP BY source, medium, campaign
ORDER BY revenue_eur DESC
LIMIT 50`),
      },
      {
        name: "Google Ads: orders with a click id",
        description: "Orders that carry gclid, gbraid or wbraid: the ones a Google Ads offline-conversion upload could report.",
        query: sql(`SELECT
    countIf(properties.gclid IS NOT NULL OR properties.gbraid IS NOT NULL OR properties.wbraid IS NOT NULL) AS google_ads_orders,
    round(sumIf(toFloat(properties.revenue), properties.gclid IS NOT NULL OR properties.gbraid IS NOT NULL OR properties.wbraid IS NOT NULL), 2) AS google_ads_revenue_eur,
    count() AS all_orders,
    round(sum(toFloat(properties.revenue)), 2) AS all_revenue_eur
FROM events
WHERE event = 'order_completed' AND {filters}`),
      },
      {
        name: "Sessions by entry campaign",
        query: trends([series("$pageview", { math: "unique_session" })], { display: "ActionsTable", breakdown: bySession("$entry_utm_campaign") }),
      },
      {
        name: "Top landing pages",
        query: sql(`SELECT
    session.$entry_pathname AS landing_page,
    count(DISTINCT $session_id) AS sessions,
    count(DISTINCT if(event = 'product_added_to_cart', $session_id, NULL)) AS sessions_with_cart,
    count(DISTINCT if(event = 'order_completed', $session_id, NULL)) AS sessions_with_order
FROM events
WHERE event IN ('$pageview', 'product_added_to_cart', 'order_completed') AND {filters}
GROUP BY landing_page
ORDER BY sessions DESC
LIMIT 25`),
      },
    ],
  },
  {
    name: "Bugout · Catalog & cart",
    description: "What visitors look at, pick and put in the cart, and where the catalog lets them down (stock-outs, failures, 404s).",
    insights: [
      {
        name: "Product views and add-to-cart rate",
        query: sql(`SELECT
    properties.product_name AS product,
    countIf(event = 'product_viewed') AS views,
    countIf(event = 'product_added_to_cart') AS adds,
    round(adds / nullIf(views, 0) * 100, 1) AS add_rate_pct
FROM events
WHERE event IN ('product_viewed', 'product_added_to_cart') AND {filters}
GROUP BY product
ORDER BY views DESC
LIMIT 30`),
      },
      {
        name: "Variants picked (kits)",
        query: trends([series("product_added_to_cart")], { display: "ActionsPie", breakdown: byEvent("variant_title") }),
      },
      {
        name: "Add to cart by source",
        query: trends([series("product_added_to_cart")], { display: "ActionsPie", breakdown: byEvent("source") }),
      },
      {
        name: "Catalog filters used",
        query: sql(`SELECT
    ifNull(properties.category, '(all)') AS category,
    properties.sort_by AS sort,
    count() AS uses,
    countIf(toInt(properties.result_count) = 0) AS zero_results
FROM events
WHERE event = 'products_filtered' AND {filters}
GROUP BY category, sort
ORDER BY uses DESC`),
      },
      {
        name: "Stock problems (lost sales)",
        description: "add_to_cart_failed by reason, and cart lines Shopify reduced or removed for lack of stock.",
        query: sql(`SELECT
    event,
    coalesce(properties.reason, '') AS reason,
    coalesce(properties.product_name, properties.product_id) AS product,
    count() AS times
FROM events
WHERE event IN ('add_to_cart_failed', 'cart_adjusted') AND {filters}
GROUP BY event, reason, product
ORDER BY times DESC
LIMIT 30`),
      },
      {
        name: "Cart opens and removals",
        query: trends([series("cart_viewed"), series("product_removed_from_cart")], { display: "ActionsLineGraph" }),
      },
      {
        name: "Contact email clicks",
        query: trends([series("$autocapture", { properties: [{ key: "href", value: "mailto:", operator: "icontains", type: "element" }] })], {
          display: "ActionsBar",
        }),
      },
      {
        name: "Pages not found (404)",
        query: trends([series("$pageview", { properties: [eventFilter("$title", "Página no encontrada", "icontains")] })], {
          display: "ActionsTable",
          breakdown: byEvent("$pathname"),
        }),
      },
    ],
  },
  {
    name: "Bugout · Health & event volume",
    description:
      "Errors, and the event volume that counts against PostHog's free tier (the billing limit is 0, so events beyond it are dropped).",
    insights: [
      {
        name: "Events this month (billable)",
        description: "All events in the project this calendar month, including test traffic. PostHog's free tier covers 1M analytics events per month.",
        query: sql(
          `SELECT count() AS events_this_month, countIf(event = '$exception') AS exceptions FROM events WHERE timestamp >= toStartOfMonth(now())`,
          { testFilter: false },
        ),
      },
      {
        name: "Events by name this month",
        query: sql(
          `SELECT event, count() AS events FROM events WHERE timestamp >= toStartOfMonth(now()) GROUP BY event ORDER BY events DESC`,
          { testFilter: false },
        ),
      },
      {
        name: "Events per day",
        query: trends([{ kind: "EventsNode", event: null, name: "All events" }], { display: "ActionsBar" }),
      },
      {
        name: "Exceptions by area",
        query: trends([series("$exception")], { display: "ActionsBar", breakdown: byEvent("area") }),
      },
      {
        name: "Order webhooks received",
        description: "order_completed / refunded / cancelled sent by the webhook route. A gap while Shopify has orders means the webhook is failing.",
        query: trends([series("order_completed"), series("order_refunded"), series("order_cancelled")], { display: "ActionsBar" }),
      },
    ],
  },
];

// ---------------------------------------------------------------------------------------------------------
// Project settings
// ---------------------------------------------------------------------------------------------------------

const PROJECT_SETTINGS = {
  timezone: "Europe/Madrid",
  week_start_day: 1,
  base_currency: "EUR",
  // Test traffic: localhost, the test site and local builds (app_env), and Shopify test orders.
  test_account_filters: [
    { key: "$host", type: "event", value: "^(localhost|127\\.0\\.0\\.1)($|:)", operator: "not_regex" },
    { key: "app_env", type: "event", value: ["preview", "local", "development"], operator: "is_not" },
    { key: "test_order", type: "event", value: ["true"], operator: "is_not" },
  ],
  test_account_filters_default_checked: true,
  // Volume-heavy features the site does not use (the SDK also disables them in code).
  heatmaps_opt_in: false,
  capture_dead_clicks: false,
  capture_performance_opt_in: false,
  autocapture_web_vitals_opt_in: false,
  session_recording_opt_in: false,
  surveys_opt_in: false,
};

const REVENUE_SETTINGS = {
  revenue_analytics_config: {
    base_currency: "EUR",
    filter_test_accounts: true,
    events: [{ eventName: "order_completed", revenueProperty: "revenue", revenueCurrencyProperty: { property: "currency" }, currencyAwareDecimal: false }],
  },
};

async function applySettings() {
  await api("PATCH", "/", PROJECT_SETTINGS);
  console.log("✓ project settings");
  try {
    await api("PATCH", "/", REVENUE_SETTINGS);
    console.log("✓ revenue analytics (order_completed.revenue, EUR)");
  } catch (error) {
    console.warn(`! revenue analytics not configured automatically (${error.message}). Set it in PostHog → Revenue analytics.`);
  }
}

async function upsertDashboard({ name, description, insights }) {
  const { results } = await api("GET", `/dashboards/?limit=200`);
  let dashboard = results.find((candidate) => candidate.name === name && !candidate.deleted);
  if (!dashboard) dashboard = await api("POST", "/dashboards/", { name, description, pinned: true });
  else await api("PATCH", `/dashboards/${dashboard.id}/`, { description, pinned: true });
  const detail = await api("GET", `/dashboards/${dashboard.id}/`);
  const existing = new Map((detail.tiles ?? []).filter((tile) => tile.insight).map((tile) => [tile.insight.name, tile.insight]));
  for (const insight of insights) {
    const body = { name: insight.name, description: insight.description ?? "", query: insight.query };
    const found = existing.get(insight.name);
    if (found) await api("PATCH", `/insights/${found.id}/`, body);
    else await api("POST", "/insights/", { ...body, dashboards: [dashboard.id] });
  }
  console.log(`✓ ${name}: ${insights.length} insights → ${HOST}/project/${PROJECT}/dashboard/${dashboard.id}`);
}

/** Runs every insight query through the query API, so a broken query fails here and not on the dashboard. */
async function check() {
  let broken = 0;
  for (const dashboard of DASHBOARDS) {
    for (const insight of dashboard.insights) {
      const query = insight.query.source;
      try {
        await api("POST", "/query/", { query });
        console.log(`✓ ${dashboard.name} / ${insight.name}`);
      } catch (error) {
        broken += 1;
        console.error(`✗ ${dashboard.name} / ${insight.name}: ${error.message}`);
      }
    }
  }
  process.exit(broken ? 1 : 0);
}

if (args.includes("--check")) await check();

await applySettings();
let failed = false;
for (const dashboard of DASHBOARDS) {
  try {
    await upsertDashboard(dashboard);
  } catch (error) {
    failed = true;
    console.error(`✗ ${dashboard.name}: ${error.message}`);
  }
}
process.exit(failed ? 1 : 0);
