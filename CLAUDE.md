# Bugout — agent and developer guide

Keep this file accurate: update it in the same change as the code it describes. Verify claims against the code; do not document intentions as facts.

## What this is

Bugout is a Spanish online shop for survival backpacks and emergency gear, built with Next.js 15 (App Router), React 19, TypeScript (strict) and Tailwind CSS 4. The UI and all copy are Spanish (`es-ES`), prices are in EUR and include 21 % IVA. It ships to Spain only, meaning the peninsula and the Balearic Islands. Canarias, Ceuta and Melilla are rejected at checkout.

`NEXT_PUBLIC_COMMERCE_PROVIDER` selects one of two commerce backends:
- `local` (default): the catalog bundled in `src/infrastructure/data/products.json`, a localStorage cart and an in-app demo checkout that places no real order.
- `shopify`: the Shopify Storefront API for catalog and cart, with Shopify's hosted checkout.

## Commands

```
npm run dev        # next dev --turbopack
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint .
npm run typecheck  # tsc --noEmit
npm test           # vitest --run (unit + component tests)
npm run test:watch
npm run e2e        # playwright test; needs `npm run build` first (it runs `next start` on port 3100)
```

Node 22 or newer (`engines`). Before finishing a change, run lint, typecheck and tests.

## Architecture

Clean Architecture. Dependencies point inward only. For details, container API and provider matrix, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```
src/app/            Next.js routes only: load data via the container, render presentation components
src/presentation/   components/<feature>/, components/ui/ (design system), context/, hooks/, i18n/, routes.ts, config/site.ts
src/application/    use-cases/, ports/ (interfaces), dtos/, catalog/ + checkout/ (pure helpers), analytics/events.ts, errors.ts
src/domain/         entities (Product, Cart, CartItem, OrderPricing), value-objects (Money, ProductId, Quantity), errors
src/infrastructure/ adapters/ (json, localStorage, shopify, posthog, local simulated services), config/ (AppContainer, env, pricing), data/
```

- `domain` imports nothing outside itself. `application` imports only `domain`.
- `app/` and `presentation/` reach infrastructure only through `@/infrastructure/config` (`getContainer()`), never adapters directly.
- `getContainer()` lazily builds a singleton `AppContainer` from env on first use, on server and client alike. There is no init call. Tests use `createContainer(config)` / `resetContainer()`.
- Imports use the `@/` alias for `src/`.

## Conventions agents must follow

- **Copy:** every user-visible string lives in `src/presentation/i18n/messages/<area>.ts` (areas: common, errors, shell, catalog, cart, checkout, forms, content) and is read as `messages.<area>.<key>`. Do not hardcode Spanish text in components.
  - Shipping-method names come only from `messages.common.shippingMethods`.
- **Formatting and errors:** format prices with `formatMoney` (plus `formatNumber`, `formatRating`, `formatDate`) from `@/presentation/i18n`. Turn thrown errors into user text with `toUserMessage(error, { productName })`. Never show `error.message`.
- **Links:** build URLs from `src/presentation/routes.ts`, using `routes.*` and `catalogUrl({ category, sort, priceMin, priceMax, inStock, onSale })`. Do not hardcode paths or link to pages that do not exist.
- **Colors:** use the theme tokens in `src/app/globals.css` (`navy`, `navy-deep`, `sand`, `accent`, `accent-hover`, `accent-soft`, `orange`, `orange-on-navy`, `ink`, `muted`, `danger`, `success`), never raw hex.
  - Contrast (WCAG AA): `orange` (#ff780c) is decorative only and fails as text on white.
  - Use `accent` for orange buttons (with white text) and for orange links or text on white.
  - Use `orange-on-navy` for orange text on navy.
- **Components:** reuse the primitives in `src/presentation/components/ui`: Button, ButtonLink, IconButton, Container, PageHeader, Breadcrumbs, Drawer, TextField, TextAreaField, SelectField, CheckboxField, RadioGroupField, PriceTag, RatingStars, ProductBadge, Spinner, VisuallyHidden, icons and `cn`. Feature components go in `src/presentation/components/<feature>/`.
- **Server first:** pages are Server Components that load data with `getContainer()`. Add `"use client"` only for interactive leaves.
  - Entities are class instances and cannot cross the server/client boundary. Pass products to Client Components as a `ProductSnapshot` (`toProductSnapshot`), and rebuild them with `fromProductSnapshot` in `presentation/components/catalog/productSnapshot.ts`.
  - The home page, product pages and `sitemap.ts` export `revalidate = 300`.
  - The root layout loads the catalog once to build the header, mobile menu and footer categories.
  - `siteConfig.url` is only correct on the server; use it from Server Components, metadata and route handlers.
- **Money:** `Money` holds integer minor units (cents) and a currency. Use `add`, `subtract`, `multiply` and the comparisons; never do arithmetic on `.amount` (major units, for display and analytics only).
  - Build values with `Money.fromMinor` or `Money.fromMajor`.
  - Discounts come from `discountPercentage(price, original)` in `domain/value-objects/Money.ts`.
- **Pricing:** `PricingPolicy` is the single source of shipping and tax. The store's policy is `storePricingPolicy` in `src/infrastructure/config/pricingPolicy.ts`: standard 4,95 € (free from 75 €), express 9,95 €, overnight 14,95 €, 21 % IVA included.
  - Get the policy from `getContainer().getPricingPolicy()`.
  - Use `calculateOrderTotals`, `shippingCost` and `freeShippingThreshold` from `domain/entities/order/OrderPricing.ts`.
  - Never hardcode amounts or thresholds in copy.
- **Shipping region:** everything is defined in `application/checkout/`.
  - `NON_SHIPPABLE_POSTAL_PREFIXES` (`35`, `38`, `51`, `52`) in `validateCheckoutDetails.ts`.
  - `SHIPPABLE_PROVINCES` and `provinceForPostalCode()` in `provinces.ts`.
  - Postal-code checks run in this order: `required` → `invalidPostalCode` → `unsupportedRegion` → `postalCodeMismatch` (the code belongs to a different province than the one selected).
- **Validation:** use cases throw `FormValidationError` (`application/errors.ts`), whose `fieldErrors` maps field paths (for example `customer.email` or `shippingAddress.postalCode`) to `ValidationCode`s: `required`, `invalidEmail`, `invalidPhone`, `invalidPostalCode`, `unsupportedRegion`, `postalCodeMismatch`, `tooShort`, `tooLong`. The UI maps these codes to copy with `validationMessage()` in `presentation/components/forms/validationMessages.ts`.
- **Domain errors:** `ValidationError`, `NotFoundError` and `BusinessRuleError` (with `code`: `MAX_QUANTITY_EXCEEDED`, `OUT_OF_STOCK`, `CURRENCY_MISMATCH`).
  - The cart allows at most 99 units per product (`MAX_QUANTITY_PER_ITEM`).
  - `Cart` has `addItem`, `setQuantity`, `deleteItem` and `clear`; there is no single-unit removal.
- **Cart state:** use `useCart()` from `presentation/context/CartContext.tsx`. It is mounted in `app/Providers.tsx` together with `useNotifications()` and `useAnalytics()`/`useConsent()`.
  - `addItem` and `checkout()` resolve `Promise<boolean>`; `checkout()` is true once navigation has started.
  - `loadError` is true when restoring the cart failed; `refresh()` retries.
  - Any other operation that must not interleave with cart mutations goes through `runExclusive(task)`. For example, the local checkout places its order this way.
- **Analytics:** track only events defined in the typed catalogue `src/application/analytics/events.ts`, through the `AnalyticsService` from `useAnalytics()`. Do not import `posthog-js` anywhere else. Add a new event to the catalogue first.
  - `AnalyticsService` has only `track`, `captureException` and `setConsent`; there is no `identify`.
  - Never send personal data (names, emails, phones, addresses, free text) in events.
  - Mark containers that show customer data with the `ph-no-capture` class.
  - Monetary properties are in major units with `currency`.
- **Consent:** analytics are gated on consent. `PostHogAnalyticsAdapter` drops every call and loads nothing until `setConsent(true)`, which happens after the visitor accepts the banner.
  - `AnalyticsProvider` restores a stored decision in a layout effect, before children track on mount, and syncs consent across tabs.
  - `ConsentDecision` is stored under `bugout.consent`, versioned by `CONSENT_VERSION`.
  - If you add any cookie or storage key, add it to the cookie table in `messages/content.ts`.
- **Accessibility and honesty:**
  - Give every control an accessible name, use one `<h1>` per page, and associate labels and errors with their fields.
  - Dialogs must trap focus, close on Escape and restore focus.
  - Respect `prefers-reduced-motion`.
  - No fabricated ratings, reviews, stock figures or success messages. The demo catalog has no ratings (`rating: null`), so the rating UI, JSON-LD `aggregateRating` and the rating and reviews sort options appear only when real review data exists (for example, Shopify `reviews.*` metafields).
  - When `getContainer().isMessagingSimulated()` is true, the newsletter and contact forms must show the demo notice and non-committal success copy.

## Environment variables

See `.env.example`. `NEXT_PUBLIC_*` values are inlined at build time; rebuild after changing them.

| Variable | Default | Read in | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_COMMERCE_PROVIDER` | `local` | `infrastructure/config/appConfig.ts` | `local` or `shopify`; any other value throws `ConfigurationError` |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | none | `appConfig.ts`, `next.config.ts` (CSP `connect-src`) | Required for `shopify`, e.g. `store.myshopify.com` |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` | none | `appConfig.ts` | Required for `shopify`; public Storefront API token |
| `NEXT_PUBLIC_SHOPIFY_API_VERSION` | `2026-07` (`DEFAULT_SHOPIFY_API_VERSION` in `adapters/shopify/ShopifyClient.ts`) | `appConfig.ts` | Storefront API version |
| `NEXT_PUBLIC_POSTHOG_KEY` | none (analytics off, `NoopAnalyticsAdapter`) | `appConfig.ts` | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `/ingest` (set in `PostHogAnalyticsAdapter`) | `appConfig.ts`, `next.config.ts` (CSP) | PostHog ingestion host |
| `NEXT_PUBLIC_SITE_URL` | see next row | `presentation/config/site.ts` | Canonical origin (metadata, sitemap, robots, JSON-LD) |
| `VERCEL_PROJECT_PRODUCTION_URL` | set by Vercel | `site.ts` | Fallback origin `https://<value>`, then `http://localhost:3000`. A production build warns when neither is set |
| `NEXT_PUBLIC_CONTACT_EMAIL` | hidden | `site.ts` | Support email on contact and legal pages |
| `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID`, `NEXT_PUBLIC_LEGAL_ADDRESS` | hidden | `site.ts` | Seller identity (LSSI) on legal pages |
| `E2E_PORT` / `E2E_SKIP_SERVER` / `CI` | `3100` / unset | `playwright.config.ts` | E2E server port, reuse a running server, CI mode |

Reference each env var literally as `process.env.NEXT_PUBLIC_X`; Next.js inlines only literal references. The simulated-delay setting (`simulatedDelayMs`) comes only from `AppConfig`, not from env.

## Testing

- Unit tests sit next to the code as `*.test.ts(x)` (Vitest, globals on, `@/` alias).
- The default environment is `node`. React component, context and hook tests opt into jsdom with `// @vitest-environment jsdom` on the **first line**, and use Testing Library (`vitest.setup.ts` loads jest-dom and cleans up).
- `PostHogAnalyticsAdapter.sdk.test.ts` runs the real `posthog-js` SDK to check consent, opt-out and storage cleanup. Keep it passing when you touch analytics.
- Test helpers: `domain/testing/` (`buildProduct`, `testPricingPolicy`), `application/testing/` (fakes, checkout details), `infrastructure/testing/` (`MemoryStorage`, Shopify fixtures). `fast-check` is available for property tests.
- Add or update tests with every behaviour change.
- E2E: Playwright specs live in `e2e/` (smoke, navigation, catalog, cart, purchase, forms, consent, a11y) with shared helpers in `e2e/support/`.
  - They run against a production build, with `desktop` (Chrome 1440×900) and `mobile` (Pixel 7) projects and locale `es-ES`.
  - Accessibility checks use `@axe-core/playwright`.
- CI (`.github/workflows/ci.yml`, Node 22) runs on pushes to `master` and on PRs: `npm ci`, lint, typecheck, `npm test`, build, `playwright install chromium`, `npm run e2e`. It uploads the Playwright report on failure.

## Known limitations / backend work pending

- Newsletter (`LocalNewsletterAdapter`) and contact (`LocalContactAdapter`) only simulate delivery after a short delay and send nothing. `isMessagingSimulated()` returns `true`, so the forms say so. No backend is connected yet.
- The `local` checkout is a demo (`LocalOrderGateway`): no payment, no real order, nothing leaves the browser. The confirmation is kept in sessionStorage (`bugout.lastOrder`).
- `order_completed` is tracked client-side only, in `LocalCheckout`. Server-side tracking (Shopify order webhooks → PostHog) is pending, so Shopify purchases are not tracked yet.
- The legal identity env vars (`NEXT_PUBLIC_LEGAL_*`) must be set before launch; the LSSI requires them.
- Product photos: in the local catalog only the survival kits (backpacks) have a photo, and they share `public/images/products/backpack.png`. Accessories show a placeholder. Shopify will supply the real images; `cdn.shopify.com` is allowed in `next.config.ts`.
- The Shopify API version default `2026-07` must stay within Shopify's supported window. Bump `DEFAULT_SHOPIFY_API_VERSION` or set the env var before it expires.
- Shopify shipping zones and rates must be configured to match `storePricingPolicy`, including excluding Canarias, Ceuta and Melilla. The app quotes shipping and tax from that policy, while Shopify's hosted checkout charges its own.
  - The Shopify market for Spain must sell in EUR; a cart priced in another currency throws `ShopifyApiError`.
- Strike-through prices (`originalPrice`) must follow the EU/Spanish price-reduction rule: the reference price must be the lowest price of the previous 30 days. The code cannot check this; it is the business's responsibility when setting prices.
- The production Content-Security-Policy (`next.config.ts`) blocks third-party scripts. Vercel's toolbar and PostHog's toolbar won't load in production.
