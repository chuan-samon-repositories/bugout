# Analytics (PostHog)

How Bugout tracks the shop end to end: the storefront (Next.js), Shopify's hosted checkout and the orders. Everything goes to one PostHog project (EU region). The PostHog billing limit is 0 €, so the project stays on the free tier: events beyond it are dropped. That is why every event below earns its place and volume-heavy features are off.

## How the pieces connect

```
Storefront (browser, after consent)           Shopify hosted checkout            Shopify backend
────────────────────────────────────          ───────────────────────            ───────────────
posthog-js → /ingest proxy → PostHog           custom pixel → PostHog             webhooks → /api/shopify/webhooks → PostHog
  $pageview, product_viewed, cart…               checkout_step_completed            order_completed / order_refunded /
  checkout_started ──┐                           checkout_alert_displayed           order_cancelled
                     │ cart attributes: _ph_distinct_id, _ph_session_id, _utm_*, _gclid/_gbraid/_wbraid
                     └──────────────► read by the pixel and copied onto the order (note_attributes) ─┘
```

- **One visitor id everywhere.** At checkout (`CartContext.checkout` → `CreateCheckoutUseCase` → `ShopifyCheckoutAdapter`) the site writes the PostHog anonymous id, session id and the landing page's campaign parameters onto the Shopify cart as hidden attributes (`cartAttributesUpdate`). The pixel sends the checkout steps under that id, and Shopify copies the attributes onto the order, so the webhook sends `order_completed` under the same id and session. Funnels and attribution work across all three.
- **Consent.** Nothing is sent from the browser before the visitor accepts analytics. Events tracked while the banner is still undecided are held in memory (max 50) and sent with their original time if the visitor accepts, or discarded if they reject. The attributes are written only with consent; otherwise the checkout gets none, and earlier ones are cleared. The site also passes its decision to Shopify (`@inContext(visitorConsent: …)`, encoded as `_cs` in the checkout URL), so Shopify's checkout and its pixels follow it. The pixel sends nothing for a cart without `_ph_distinct_id`.
- **Orders without consent** still reach PostHog from the webhook, with no link to the visit: distinct id `shopify_order_<id>`, no session, no campaign. Revenue totals are complete regardless of the consent rate; funnels and attribution cover only consenting visitors.
- **No personal data.** No names, emails, phones, addresses or free text in any event. Server and pixel events set `$process_person_profile: false`; the browser uses `person_profiles: 'identified_only'` and never identifies.

## Event catalogue

Typed in `src/application/analytics/events.ts` (browser events: `AnalyticsEvent`; webhook events: `ServerAnalyticsEvent`). The pixel can't import it and mirrors the names.

| Event | Source | When | Key properties |
|---|---|---|---|
| `$pageview`, `$pageleave` | SDK | Every page (App Router navigations included) | `$pathname`, `$title`, UTM/click ids on landing |
| `$autocapture` | SDK | Clicks on `a`, `button`, `summary`, `[role=button]` only | element text, `href` |
| `$exception` | SDK / `captureException` | Uncaught errors, failed cart and checkout operations | `area`, `action` |
| `product_viewed` | `ProductViewTracker` | Product page | product + variant, `badge`, `in_stock` |
| `product_variant_selected` | `PurchasePanel` | Visitor picks another variant | product + variant |
| `product_added_to_cart` | `CartContext` | Units the store really added | product, cart totals, `quantity`, `source` (`product_page`, `product_card`, `cart_drawer`, `kit_builder`) |
| `kit_builder_added_to_cart` | `KitBuilder` (Kit Custom page) | The builder put the selection in the cart (each line is also a `product_added_to_cart`) | cart totals, `kit_slug`, `line_count`, `unit_count`, `base_slug`, `preset_slug` |
| `product_removed_from_cart` | `CartContext` | Line removed or quantity lowered | product, cart totals, `quantity` |
| `add_to_cart_failed` | `CartContext` | Add failed | `product_id`, `reason` |
| `cart_adjusted` | `CartContext` | Shopify lowered or dropped a line for stock (lost sale) | `product_id`, `product_name`, `reason`, `quantity_requested`, `quantity_kept` |
| `cart_viewed` | `CartContext` | Visitor opens the drawer | cart totals |
| `products_filtered` | `CatalogView` | Catalog filters change (debounced) | filters, `result_count` |
| `checkout_started` | `CartContext` | Hand-off to checkout starts (sent with `sendBeacon`) | cart totals, `checkout_type` |
| `checkout_failed` | `CartContext` | Checkout could not start | cart totals |
| `checkout_step_completed` | pixel (hosted) / `LocalCheckout` (demo) | Contact, address, shipping, payment (hosted) | `step`, `step_name`, cart totals, `checkout_type` |
| `checkout_alert_displayed` | pixel | Shopify shows the buyer an error | `alert_type`, `alert_target` (never the message) |
| `order_completed` | webhook `orders/paid` (demo: `LocalCheckout`) | Order paid | `order_id`, `revenue` (total incl. shipping and IVA), `shipping`, `tax`, `discount`, `discount_codes`, `products[]`, `utm_*`, `gclid`/`gbraid`/`wbraid`, `test_order` |
| `order_refunded` | webhook `refunds/create` | Refund issued | `order_id`, `refund_amount`, `item_count` |
| `order_cancelled` | webhook `orders/cancelled` | Order cancelled | `order_id`, `reason`, `revenue` |
| `newsletter_subscribed`, `contact_message_sent` | forms | Hidden until messaging has a real backend | |

Every browser and webhook event also carries `app_env` (`production`, `preview`, `local`), `commerce_provider` and `app_release` (short commit), set in `next.config.ts` from Vercel's `VERCEL_ENV` and `VERCEL_GIT_COMMIT_SHA`.

Deliberately **not** tracked, to stay within the free tier: heatmaps, dead clicks, web vitals and performance events, session recordings, surveys, and autocapture of form changes and submits. Product-card clicks are covered by autocapture (`href`) instead of a custom event.

## Google Ads (prepared, not active)

- PostHog records `gclid`, `gbraid`, `wbraid` and `gad_source` on landing, so the **Sessions by channel** insight shows "Paid Search" traffic as soon as ads run.
- The site keeps the landing page's UTM tags and Google Ads click ids and writes them onto the cart at checkout; the webhook copies them onto `order_completed`. **Acquisition & Google Ads → Google Ads: orders with a click id** counts the orders a conversion upload could report.
- To send conversions to Google Ads later, the options are PostHog's "Google Ads Conversions" destination (it uses `gclid` on `order_completed`) or Shopify's Google & YouTube app on the checkout. Either way, **add an advertising ("marketing") consent category to the banner first**: today the banner asks only for analytics, the checkout gets `marketing: false`, and click ids are used only for analytics inside PostHog. Use Google Consent Mode v2 if the Google tag is ever added to the site, and add its cookies to the cookie table.
- Tag every ad's final URL with `utm_source=google&utm_medium=cpc&utm_campaign=<campaign>` (or use a tracking template) so campaigns show up by name.

## Dashboards

Created by `scripts/posthog/setup.mjs` (idempotent; re-run after changing it). All exclude test traffic: `localhost`, `app_env` `preview`/`local`/`development`, and Shopify test orders (`test_order`).

| Dashboard | What it answers |
|---|---|
| **Bugout · Sales** | Revenue, orders, AOV, net revenue after refunds, conversion rate, top products, discount codes, shipping methods, cancellations |
| **Bugout · Purchase funnel** | Landing → product → cart → checkout → contact → payment → order; by device; hosted checkout steps; checkout errors and hand-off failures |
| **Bugout · Acquisition & Google Ads** | Sessions by channel and entry campaign, orders and revenue by channel and UTM campaign, orders with a Google Ads click id, landing pages |
| **Bugout · Catalog & cart** | Product views and add-to-cart rate, variants picked, add sources, filters, stock problems, cart opens and removals, contact email clicks, 404s |
| **Bugout · Health & event volume** | Billable events this month (watch the free tier), events by name and day, exceptions, order webhooks received |

PostHog's built-in **Web analytics** and **Revenue analytics** pages (revenue event: `order_completed.revenue`, EUR) work too.

```
POSTHOG_PERSONAL_API_KEY=phx_... node scripts/posthog/setup.mjs --project 73133 --check   # validate queries only
POSTHOG_PERSONAL_API_KEY=phx_... node scripts/posthog/setup.mjs --project 73133           # apply
```

The script also sets the project to Europe/Madrid, Monday weeks, EUR, the test-traffic filter (on by default), and turns off heatmaps, dead clicks, web vitals, performance capture, recordings and surveys.

## Setup outside the code (Carlos)

1. **Vercel → Settings → Environment Variables:**
   - `SHOPIFY_WEBHOOK_SECRET` (Production only, **not** `NEXT_PUBLIC_`): the signing key from step 2.
   - `NEXT_PUBLIC_POSTHOG_KEY=phc_Ti9LSXK59iAHtxd5ZUgTrNgzrGwSRCfAHwQlqtLS0o` for Production. For Preview (`develop` / test.bugout.es), leave it empty, or use the same key: test traffic is tagged `app_env=preview` and filtered out of every dashboard, but it still counts towards the free tier.
   - Redeploy after changing them (`NEXT_PUBLIC_*` values are inlined at build time).
2. **Shopify admin → Settings → Notifications → Webhooks → Create webhook**, three times, format JSON, latest API version, URL `https://bugout.es/api/shopify/webhooks`: events **Order payment**, **Refund create**, **Order cancellation**. Copy the "signed with" key shown under the list into `SHOPIFY_WEBHOOK_SECRET`. Use **Send test** on each one: the Health dashboard's "Order webhooks received" should show it (as a test order, excluded from sales).
3. **Shopify admin → Settings → Customer events → Add custom pixel** "Bugout PostHog": paste `shopify/custom-pixel.js`, set Permission **Required** (analytics) and Data sale **does not qualify**, Save, then **Connect**.
4. **Shopify admin → Settings → Customer privacy:** keep the cookie banner on for the EU. With the site's decision passed along, visitors who already chose on bugout.es are not asked again.
5. **PostHog → Settings → Billing:** keep the billing limit at 0 for Product analytics and set 0 for every other product too (exceptions, session replay, feature flags, data warehouse), so nothing can be charged.
6. **Rotate the personal API key** used to create the dashboards (PostHog → Settings → Personal API keys), since it was shared in a chat. Create a new one only when re-running the setup script.

## Limits and caveats

- Browser data covers only visitors who accept analytics. Webhook revenue is complete.
- Refund webhooks carry no cart attributes, so refunds are filed under `shopify_order_<order id>`, not the visitor.
- The pixel needs the checkout to see `_ph_distinct_id`; a visitor who accepts analytics only inside Shopify's checkout (not on the site) is not linked.
- `app_env` comes from Vercel at build time; a build outside Vercel reports `local`, which the dashboards exclude.
- If you change the PostHog project, update the key in the pixel (`POSTHOG_KEY` in `shopify/custom-pixel.js`) and re-paste it in Shopify.
