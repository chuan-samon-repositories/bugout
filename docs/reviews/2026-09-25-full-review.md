# Bugout — Full Code, Architecture, Analytics & UX Review

**Date:** 2026-09-25 · **Branch reviewed:** `claude/page-code-review-testing-0ba3ky` @ `5e513b9`
**Scope:** entire repository (≈9.5k LOC TS/TSX), production build, and every user flow driven end-to-end with Playwright (Chromium, 1440×900 and 390×844).

---

## 1. Executive summary

Bugout has a clean-looking skeleton: domain entities and value objects, use cases behind ports, swappable adapters, and 132 unit tests. The **running app doesn't live up to that skeleton**, though. The product detail page and the checkout skip the architecture entirely. The DI bootstrap is never called. Several flows lose money or give wrong information, which is visible in the browser:

| # | Finding (reproduced in browser) | Severity |
|---|---|---|
| 1 | Product detail page shows hardcoded prices: **Emergency Food Pack displays $199, cart charges $49**; 4 of 6 products show fake data | Critical |
| 2 | Order confirmation shows **Total: $8.63** for a $214.92 order (computed after the cart is cleared) | Critical |
| 3 | Checkout accepts **completely empty** contact, address and card fields and "confirms" the order ("Email Confirmation: Sent to ␣") | Critical |
| 4 | Reloading `/checkout` with items in the cart **bounces the user to `/products`** | High |
| 5 | 99-per-item cart limit bypassed: **150 units** of a new item accepted | High |
| 6 | Overnight/express shipping advertised at $29.99/$15.99, charged **FREE** above $75; free-shipping threshold is "$75" in cart/checkout but "$150" on product pages | High |
| 7 | Typing "100" in the max-price filter yields **"10"** and focus drops to `<body>` (whole page swaps to a spinner on each keystroke) | High |
| 8 | Add-to-cart failures (unknown product, >99) are **silent**; success has no feedback either | High |
| 9 | `initializeDependencies()` is **never called** — the Shopify provider switch is dead; CLAUDE.md claims otherwise | High |
| 10 | **Analytics captures no e-commerce events** — only `$pageview`/`$autocapture`; the purchase itself is invisible; cookies set without consent (EU/Spain) | High |
| 11 | `next@15.3.8` has a **critical** advisory (plus 4 high in the tree) | High |
| 12 | 8 of 132 unit tests **fail** on the branch; hook tests are tautological | Medium |

**Overall:** the architecture is a good start, but it only covers about half the app. The fixes are mostly localized, and the top five could each ship in under a day.

---

## 2. How this was tested

- **Static review** of every file under `src/`, configs, `CLAUDE.md`, docs and git history.
- **Tooling:** `npm test` (8 fail / 124 pass), `tsc --noEmit` (clean), `npm run lint` (clean), `next build` (clean), `npm audit --omit=dev` (1 critical, 4 high, 1 moderate).
- **Playwright (production build):** crawl of all routes at two viewports (console errors, failed requests, link status, heading/landmark/label checks, overflow detection, full-page screenshots), and scripted flows: product detail → add to cart → cart drawer → checkout (4 steps) → confirmation, filters/sort, mobile menu, newsletter, contact form, `localStorage` tampering.
- **Analytics capture:** a dev build with a dummy PostHog key; every `/ingest/*` request was intercepted locally and decoded, so no data left the sandbox. Note: PostHog correctly drops headless-browser traffic as bot traffic. To see events I had to mask `navigator.webdriver` and the headless UA.

---

## 3. Architecture

### What's good
- Clear layer folders (`domain` / `application` / `infrastructure` / `presentation`) with inward-pointing imports in the core layers.
- Value objects (`Money`, `Quantity`, `ProductId`) validate on construction; `Cart` is a sensible aggregate root.
- Ports (`ProductRepository`, `CartRepository`, `CheckoutService`) make adapters swappable. Shopify adapters show the intended pay-off.
- `CartContext` gives the app a single cart source of truth (good move over the per-component `useCart` hook).

### Where the architecture is bypassed or broken

| Issue | Evidence | Impact |
|---|---|---|
| **Product detail page ignores the repository** and uses a hardcoded 2-product map with a fake fallback ($199/$249, 4.8★, "In Stock") for any slug | `src/app/products/[productName]/page.tsx:27-121,130` | Wrong prices (Food Pack $199 vs $49 in cart), fake products for any URL (`/products/anything` → 200 with "Add to Cart"), soft-404s for SEO |
| **Checkout business rules live in the page component** — shipping tiers, free-shipping threshold, 8% tax, order number, "submit" | `src/app/checkout/page.tsx:75-120` | Untestable, duplicated thresholds (cart says $75, PDP says $150), wrong US-style tax for a Spanish store; `CreateCheckoutUseCase` just returns `"/checkout"` |
| **DI bootstrap never runs** — `initializeDependencies()` has no call site; `getInstance()` silently falls back to `{provider:'local'}` | `src/infrastructure/config/dependencies.ts:45-50,102-114` | `NEXT_PUBLIC_COMMERCE_PROVIDER=shopify` does nothing. CLAUDE.md says it's initialized in `layout.tsx` (it isn't) |
| **Adapters re-created on every factory call** | `dependencies.ts:56-95` | Harmless today, but `ManageCartUseCase` and `CreateCheckoutUseCase` get different cart repositories; any adapter with state/caching breaks |
| **`ApiProductAdapter` is dead code** — not wired in DI; CLAUDE.md documents env vars (`NEXT_PUBLIC_PRODUCT_ADAPTER`, `NEXT_PUBLIC_API_*`) that don't exist | `infrastructure/adapters/product/ApiProductAdapter.ts` | Misleads maintainers and AI agents |
| **DTOs live in the domain** (`domain/entities/*/ *DTO*.ts`) and are used by infrastructure for persistence shapes | `src/domain/entities/cart/CartDTO.ts`, `product/ProductDTOI.ts` | Serialization concerns leak into the core |
| **Aggregate invariants leak** — `Cart.getItems()` returns live `CartItem`s whose `quantity` is public and mutable | `domain/entities/cart/CartItem.ts:11`, `Cart.ts:54-56` | Any caller can set quantity 500 without the 99 rule |
| **Cart limit only enforced when merging** — a new line with qty > 99 is accepted | `domain/entities/cart/Cart.ts:16-28` | Reproduced: 150 × 72H backpack in cart |
| **No out-of-stock rule** in `Cart.addItem`/`addToCart` although `BusinessRuleError` docs cite it | `Cart.ts`, `ManageCartUseCase.ts:35-43` | Out-of-stock products can be bought |
| **Cart stores full product snapshots in `localStorage`, never re-priced** | `LocalStorageCartAdapter.ts:40-58` | Reproduced: editing storage to `price: 1` shows "Hacked — $1.00" in the cart and checkout. Harmless in a simulation, but a real payment step would have to re-price server-side. Stale prices also survive catalog changes |
| **`Money` is a bare float, no currency** (`NaN`/`Infinity` pass validation) | `domain/value-objects/Money.ts` | Rounding drift (`0.1+0.2`), `$` hardcoded everywhere for a Spanish (EUR) store |
| `Product.isFeatured()` derives from badge; JSON's `featured` field is ignored | `Product.ts:46-48`, `public/product_list.json` | Two sources of truth for "featured" |
| Presentation duplicates the domain type (`app/products/types.ts` `Product`) and maps in the page | `app/products/page.tsx:22-36` | Acceptable ViewModel pattern, but it's local to one page. PDP, cart and checkout use domain entities directly |
| **Everything is a client component** (`"use client"` on pages incl. product detail) | all `app/**/page.tsx` | No SSR data, no per-product `generateMetadata`, `<title>` is "Bugout" on every page; JSON is fetched client-side after hydration |

### Recommended target shape
1. Load products **server-side** (RSC) through the repository: `/products/[id]` does `findById` and calls `notFound()` if it's missing; add `generateStaticParams` + `generateMetadata`.
2. Move pricing rules into the domain/application layer: `ShippingPolicy`, `TaxPolicy`, `OrderSummary` (subtotal/shipping/tax/total in integer cents + currency), plus a `PlaceOrderUseCase`. The checkout page then renders a DTO.
3. Call `initializeDependencies()` once in a client bootstrap (`Providers.tsx`), cache adapter instances in the container, and delete or wire `ApiProductAdapter`.
4. Make `Cart` enforce the limit on every path (`new CartItem` too), check `inStock`, return read-only views (`ReadonlyArray<Readonly<...>>` or DTOs).
5. Persist only `{productId, quantity}` in `localStorage`; re-hydrate product data from the repository on load.

---

## 4. Clean code

| Area | Finding | Location |
|---|---|---|
| Dead code | `useCart`, `useProducts` hooks (superseded by `CartContext`), `ProductFilters.tsx`, `components/Product.tsx`, `app/products/hooks/index.ts` (comment-only), `app/products/index.ts` re-exporting a page default, `ProductRepository.findByCategory/search` (never called) | various |
| Duplication | `useCart.ts` ≈ `CartContext.tsx`; product-row → `Product` mapping written 5×; GraphQL `fetch` helper copied in 3 Shopify adapters; mobile vs desktop filter markup duplicated in full; product data duplicated in JSON, PDP map, homepage showcase (`$299`, "BESTSELLER" — JSON says PREMIUM) | `CompactFilters.tsx`, `ProductShowcase.tsx:56,69` |
| Stale docs | `app/products/README.md` describes `utils/`, hooks and signatures that don't exist | |
| Comment noise | Long JSDoc restating signatures; "Requirements: 2.4, 2.5" references to a spec not in the repo (14 occurrences); leftover notes like "Group items by id… not needed with new architecture" followed by `const groupedItems = cartItems` | `checkout/page.tsx:122-124` |
| Type safety | `sortBy as SortOption` casts an arbitrary string; `FilterState.freeShipping` unused; `process.env.NEXT_PUBLIC_POSTHOG_KEY!` non-null assertion; `ApiProductAdapter` casts `response.json()` with no runtime validation (tests show the real contract is `{data:[...]}`) | `products/page.tsx:50`, `instrumentation-client.ts:4` |
| Error handling | `JsonProductAdapter.findAll` wraps every error in a generic `Error` (loses `NotFoundError` type); `ApiProductAdapter` retries 401/403/400 although the docstring says only 5xx/network; `findByCategory` interpolates without `encodeURIComponent`; GraphQL `errors`/`userErrors` ignored → `data` may be null → TypeError | `ApiProductAdapter.ts:71,116-139` |
| React | `CartContext` value object not memoized (re-renders every consumer); `useProductFilters` has no cancellation (stale responses can overwrite newer ones); `setTimeout` in checkout/contact not cleared on unmount; scroll listener not `passive` | `CartContext.tsx:109`, `useProductFilters.ts:25-42` |
| CSS | `body { font-family: Arial }` overrides the Geist fonts that `layout.tsx` downloads; `bg-opacity-50` is removed in Tailwind v4 (out-of-stock overlay would be solid black); body `pt-[80px]` vs 50px header leaves a 30px gap, patched with `-mt-20 pt-20` on the hero; `cursor-pointer` on non-interactive cards | `globals.css:51`, `ProductCard.tsx:57`, `layout.tsx:32` |
| Content bugs | `We&apos;re` rendered **literally** (HTML entity inside a JS string); Instagram SVG path is wrong (renders a dot); payment badges clip ("TERC", "AYPA"); rating stars use `Math.floor` (4.9 → 4★) | `Principles.tsx:19`, `Footer.tsx`, `ProductCard.tsx:82` |
| Assets | One 1.98 MB `backpack.png` used for every product, every thumbnail, with `priority` on all of them; hero image hotlinked from Unsplash as a CSS background (not optimized, third-party dependency) | `ProductImage.tsx:13,30`, `MainProducts.tsx:10` |

---

## 5. Analytics (PostHog)

### What's configured
- `instrumentation-client.ts` calls `posthog.init(KEY!, { api_host, capture_pageview: "history_change" })`. Autocapture is on by default.
- `next.config.ts` reverse-proxies `/ingest/*` to PostHog EU. This is the right idea for ad-blockers and first-party cookies.
- `posthog-node` is installed but **never imported**. There is no server-side capture despite CLAUDE.md.

### What is actually sent (captured during a full purchase journey)
```
$pageview     /                       $pageleave   /
$autocapture  a "Shop 24H Kit"        $pageview    /products/24h-survival-backpack
$autocapture  button "Add to Cart - $199"
$autocapture  span "Cart"             $autocapture button "Proceed to Checkout"
$pageview     /checkout               $autocapture input "" ×2
$autocapture  button "Continue" ×3    $rageclick   button "Complete Order"   ← false positive
$autocapture  button "Complete Order" $pageview    /products
```
Distinct events: `$pageview`, `$pageleave`, `$autocapture`, `$rageclick`. **No input values or email leaked**, which is good.

### Gaps
1. **No e-commerce events.** There is no `product_viewed`, `product_added_to_cart` (with id/price/qty), `cart_viewed`, `checkout_started`, `checkout_step_completed`, `order_completed` (with revenue/order id), or `filter_applied`. So you can't build a funnel, see revenue, or run an A/B test on conversion. Actions defined on autocapture text are brittle, because the button text embeds the price ("Add to Cart - $199").
2. **The purchase is invisible.** The confirmation renders on the same `/checkout` URL with no event, so it can't be told apart from abandonment.
3. **False rage clicks.** The stepper reuses one button in the same spot for Continue ×3 → Complete Order, so a normal user flow gets flagged as `$rageclick` and pollutes frustration metrics.
4. **No `identify`.** Checkout collects an email but never calls `posthog.identify`, so sessions can't be joined to customers.
5. **Consent / GDPR (Spain):** PostHog persists `localStorage+cookie` on the first page load with no consent banner, and the `/cookies` and `/privacy` pages 404. Under the EU ePrivacy Directive and Spain's LSSI, non-essential analytics cookies need prior consent. Use `opt_out_capturing_by_default` or `persistence: 'memory'` until consent is given, or cookieless mode.
6. **Config hygiene:**
   - The non-null `!` on the key means that without env vars the console logs `PostHog was initialized without a token` on every page (seen in the crawl).
   - The `/ingest/decide` rewrite is unreachable because `/ingest/:path*` above it matches first, and the SDK now calls `/flags`.
   - `ui_host` isn't set, so toolbar/links point at the proxy.
   - There's no environment separation, so preview/dev traffic goes to the prod project if the same key is used.
   - `capture_exceptions` is commented out, so there's no error tracking. That matters here, because every cart failure is `console.error`-only.
7. **No server-side analytics.** `order_completed` should be captured server-side (posthog-node) once there's a real order backend, so ad-blockers don't cause revenue to be undercounted.

### Recommended event plan (minimal)
| Event | Where | Properties |
|---|---|---|
| `product_viewed` | PDP mount | `product_id, name, price, category, badge` |
| `product_added_to_cart` | `CartContext.addItem` success | `product_id, quantity, price, cart_value` |
| `add_to_cart_failed` | `addItem` catch | `product_id, reason` |
| `cart_opened` | Header toggle | `item_count, cart_value` |
| `checkout_started` / `checkout_step_completed` | checkout | `step, step_name, cart_value` |
| `order_completed` | order success (server-side later) | `order_id, revenue, shipping, tax, currency, items[]` |
| `products_filtered` | filter change (debounced) | `category, price_min, price_max, sort, result_count` |
| `newsletter_subscribed` | newsletter | `location` (home/footer) |

Put these in one `analytics` port, e.g. `application/ports/Analytics.ts` with a `PostHogAnalyticsAdapter`, so the architecture stays consistent and tests can assert on calls.

---

## 6. UX flows (all reproduced with Playwright)

### Browse → Product detail
- ❌ 4/6 products show **fake** price/rating/specs on their detail page (see §3). Food Pack: "$199 / Save $50" on PDP, $49 in the cart.
- ❌ `/products/anything` renders a real-looking product with "Add to Cart". Clicking it does nothing visible (console-only `NotFoundError`). It should be a 404.
- ❌ Stock status is hardcoded "✓ In Stock – Ready to Ship".
- ❌ Quantity stepper has no upper bound (up to "Add to Cart – $44850"). Past 99, adds fail silently.
- ❌ No feedback on successful add: the drawer doesn't open, there's no toast, only the header badge bounces.
- ⚠️ Thumbnails are the same image. "♡ Save" and the card heart button do nothing and have no label (the heart is also hover-only, so it's invisible on touch). The reviews tab shows the same 3 fake reviews for every product. Tabs lack `role="tablist"`.

### Catalog & filters
- ❌ Every filter change swaps the **entire page** for "Loading products…" (`products/page.tsx:74`). Inputs unmount, so typing "100" becomes "10" with focus lost, and the view flashes.
- ❌ Category counts are computed from the *filtered* list, so after choosing Accessories the dropdown reads "All Products (3) / Survival Kits (0)" (`products/page.tsx:72`).
- ❌ Clearing the max-price field snaps it to 500. Min > max, and negative prices, are accepted without a hint.
- ❌ Filters aren't in the URL: reload resets them, they can't be shared, and footer links like "Sale Items"/"Accessories" can't deep-link. Those point to `/products/sale` and `/products/accessories`, which render fake products.
- ⚠️ Mobile: price row inputs lack `min-w-0`, so the page is **550px wide on a 390px screen** (horizontal scroll). The PDP (511px) and contact (419px) also overflow.

### Cart drawer
- ❌ Not a dialog: no `role="dialog"`/`aria-modal`, no Escape to close, focus not moved or trapped, body still scrolls underneath. It can be open **at the same time** as the nav menu.
- ❌ `handleCheckout` has no try/catch. A failing checkout service would be an unhandled rejection with the button stuck.
- ⚠️ No product image or link in line items. Icon buttons (close, −, +, delete) have no accessible names (delete uses only `title`). The header badge overlaps the "Cart" label.

### Checkout
- ❌ **Direct load / reload of `/checkout` redirects to `/products`** even with a full cart. The guard checks `loading`, but that's only true during mutations, never during the initial `localStorage` load, and the child effect runs before the provider's load effect (`checkout/page.tsx:55-59`).
- ❌ **No validation at all.** There's no `<form>`, so `required` is inert. You can click through all 4 steps with every field empty and get "Order Confirmed … Sent to ␣".
- ❌ **Confirmation total is wrong** ($8.63 vs $214.92): `clearCart()` runs, then the confirmation recomputes the total from the now-empty cart (`checkout/page.tsx:113-119,146`). Snapshot the order before clearing.
- ❌ Shipping options show $15.99/$29.99, but above $75 every method is free in the summary (`checkout/page.tsx:81`). The free-shipping threshold also disagrees with the PDP ($150).
- ❌ Unchecking "Billing address same as shipping" reveals nothing. Billing fields exist in state but are never rendered.
- ⚠️ 0 of the form's inputs have associated labels (`<label>` without `htmlFor`). CVV is `type="text"`, and there's no `autocomplete`/`inputmode` on card, email, phone, address. The progress stepper isn't navigable. The sticky summary uses `top-8` (32px) under a 50px fixed header, so its top is hidden when scrolling. Tax is a flat 8% on goods + shipping (Spain: IVA 21% included in displayed prices). Fields default to "United States" and ZIP/State.

### Navigation, content & forms
- ❌ **13 internal links 404:** `/blog /careers /reviews /help /shipping /returns /size-guide /warranty /privacy /terms /cookies /support`, plus soft-404s `/products/custom-kit|accessories|sale`. Next.js also **prefetches all of them** on every page load. Social links are `href="#"`.
- ❌ Header "Custom Kit" links to `/products/custom-kit`; the real id is `custom-survival-kit`.
- ❌ "SALE" pill in the menu has `cursor-pointer` but isn't a link.
- ❌ Newsletter says "Successfully subscribed! Check your email…" with no request made. The footer subscribe button does nothing (no form). The contact form "sends" with no request, and "Send Email →", "Start Chat" and social buttons are no-ops.
- ⚠️ Hamburger is the only desktop navigation (no visible nav links on a 1440px screen). It has no `aria-label`/`aria-expanded` and no Escape to close.
- ⚠️ Marketing claims are hardcoded ("5.0 Rating • 2,500+ Reviews", "Join over 10,000", "256-bit SSL") and don't match the data.

### Language & accessibility
- ❌ CLAUDE.md and the metadata say this is a Spanish-language store, but **all UI copy is English**, `<html lang="en">`, currency is `$`, and product JSON is English. Pick one; if Spain is the market, add i18n (`next-intl`), `lang="es"`, and `€` via `Intl.NumberFormat('es-ES', {style:'currency', currency:'EUR'})`.
- ⚠️ Two `<h1>`s per page (logo + page title). No skip link. Many unlabeled icon buttons (1–8 per page). No `prefers-reduced-motion` handling for the numerous `animate-bounce`/`pulse`/`scale` effects.

---

## 7. Security & dependencies
- `npm audit --omit=dev`: **next 15.3.8 (critical** — image-optimizer cache-key confusion / content injection, middleware-redirect SSRF), postcss, nanoid, preact (via posthog-js), sharp (**high**), fflate (moderate). Upgrade Next to the latest 15.5.x patch and refresh the lockfile.
- `ApiProductAdapter` is designed to read a **Bearer token from a `NEXT_PUBLIC_*` variable**, per CLAUDE.md, which ships it to every browser. If that adapter is revived, it must run server-side.
- Card data (number, CVV) is held in React state as plain text. That's fine for a simulation, but real payments must use a hosted field or redirect (Stripe Elements / Shopify checkout) and never touch app state. PostHog masks inputs by default. Keep `maskAllInputs` explicit if session replay is ever enabled.
- Client-trusted cart prices (see §3). Any real order must be re-priced on the server.
- Shopify adapters pin API version `2024-01`, which Shopify no longer supports, and `ShopifyCartAdapter.save()` creates a new cart on every mutation (acknowledged in a comment).

---

## 8. Testing
- **Result:** 124 pass, **8 fail** — all in `ApiProductAdapter.test.ts`. The tests mock `{ data: [...] }` but the adapter maps the raw body, so the contract drifted. The retry tests also sleep for real (~4s); use `vi.useFakeTimers()`.
- **Hook tests don't test hooks.** `useCart.test.ts` spies on `useCase.addToCart`, mocks its return, calls it, and asserts on the mock. No hook is rendered (`environment: 'node'`, no `@testing-library/react`).
- **Blind spots that let the browser bugs through:** there are zero tests for pages/components, the checkout pricing logic, `CartContext`, the Shopify adapters, or E2E. The property-based `Cart` tests only cover *merging* past 99, not a first add over 99, which is why F3 exists.
- **Recommended:**
  - Add Playwright E2E for the golden path, based on the scripts used for this review.
  - Add RTL tests for `CartContext` and the filters.
  - Add unit tests for the extracted `OrderSummary`/`ShippingPolicy`.
  - Add a CI workflow (there's no `.github/workflows`) running lint + tsc + test + build.

---

## 9. AI usage in the development process

The repo shows clear signs of AI-assisted, spec-driven generation:
- `.kiro` is gitignored, and 14 comments cite numbered "Requirements".
- `CLAUDE.md` is the agent context file.
- The hexagonal refactor landed as one commit: 66 files, +6,417 lines (`c557382`).
- There's a vendor-comparison doc and highly uniform JSDoc.

That produced a good scaffold quickly. The review surfaced the typical failure modes of that workflow:

1. **Context-file drift is the biggest risk.** `CLAUDE.md` states things that are false:
   - DI is initialized in `layout.tsx`.
   - `NEXT_PUBLIC_PRODUCT_ADAPTER` / `NEXT_PUBLIC_API_*` env vars exist.
   - Sort keys are `price-asc/desc` (they're `price-low/high`).
   - The UI is Spanish.
   - PostHog runs client *and* server.
   - Coverage includes "all adapters" (Shopify has none, and the API adapter tests fail).

   Future agent sessions will act on these false statements. Treat `CLAUDE.md` as code: update it in the same PR as the change, and keep it short and factual.
2. **Refactor coverage stops at what the spec named.** Catalog and cart were migrated; the PDP, checkout, homepage showcase and footer weren't. So the app has two parallel "truths".
3. **Plausible-but-hollow code:**
   - Tautological tests.
   - Unused hooks and ports kept "for completeness".
   - A README that describes an older design.
   - Retry logic whose docstring contradicts its behavior.
   - `Requirements:` tags pointing to an absent spec.
4. **Mitigations:**
   - Commit the spec (or remove the tags).
   - Require E2E evidence (Playwright) for UI-affecting AI changes.
   - Ask agents to delete superseded code in the same change.
   - Add CI so failing tests can't merge.

There are **no AI features in the product itself**. Plausible future additions: a "kit builder" assistant for the Custom Kit, or semantic search over the catalog, both routed through a port like the rest of the app.

---

## 10. Prioritized plan

**P0 — correctness & trust (1–2 days)**
1. PDP: load via `GetProductByIdUseCase` (server component), `notFound()` for unknown ids, and remove the hardcoded map and fake fallbacks. Fix header/footer links.
2. Checkout: snapshot the order before `clearCart()`, fix the reload redirect (add an `initialized` flag to `CartContext`), add real validation (`<form>`, labels, `autocomplete`), and make shipping price display match the charged price.
3. `Cart`: enforce ≤ 99 on new lines and `inStock`; surface add-to-cart success/errors in the UI (toast + open drawer).
4. Filters: don't unmount the page while loading (keep results and show an inline spinner), compute category counts from the unfiltered list, and debounce the price inputs.
5. Upgrade `next` (critical CVE), and fix the 8 failing tests.

**P1 — analytics & compliance (2–3 days)**
6. Add an analytics port and the event plan in §5, with `identify` at checkout and `order_completed` including revenue.
7. Add a consent banner and gate PostHog persistence; add `/privacy` and `/cookies`.
8. Clean up the rewrites and `ui_host`, guard for a missing key, and enable exception capture.

**P2 — architecture & quality (1 week)**
9. Move pricing, shipping and tax into the domain (`OrderSummary`, integer cents + currency). Call `initializeDependencies()` and cache adapters. Store only ids and quantities in `localStorage`.
10. Delete dead code (`useCart`, `useProducts`, `ProductFilters`, `components/Product.tsx`, stale README) and consolidate the Shopify GraphQL client.
11. Accessibility pass: dialog semantics and focus management for the drawer and menu, labels, one `<h1>`, `prefers-reduced-motion`, and the mobile overflow fix.
12. Decide the language: i18n with `lang="es"` and EUR formatting, or make the docs say English.
13. Add CI (lint, tsc, vitest, Playwright), and rewrite `CLAUDE.md` to match reality.
