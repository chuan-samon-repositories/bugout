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
- **Formatting and errors:** format prices with `formatMoney` (plus `formatNumber`, `formatRating`, `formatDate`) from `@/presentation/i18n`. Turn thrown errors into user text with `toUserMessage(error, { productName })`. Never show `error.message`.
- **Links:** build URLs from `src/presentation/routes.ts`, using `routes.*` and `catalogUrl({ category, sort, priceMin, priceMax, inStock, onSale })`. Do not hardcode paths or link to pages that do not exist.
- **Colors:** use the theme tokens in `src/app/globals.css` (`navy`, `navy-deep`, `sand`, `accent`, `accent-hover`, `accent-soft`, `orange`, `orange-on-navy`, `ink`, `muted`, `danger`, `success`), never raw hex.
  - Contrast (WCAG AA): `orange` (#ff780c) is decorative only and fails as text on white.
  - Use `accent` for orange buttons (with white text) and for orange links or text on white.
  - Use `orange-on-navy` for orange text on navy.
- **Components:** reuse the primitives in `src/presentation/components/ui`: Button, ButtonLink, IconButton, Container, PageHeader, Breadcrumbs, Drawer, TextField, TextAreaField, SelectField, CheckboxField, RadioGroupField, PriceTag, RatingStars, ProductBadge, Spinner, VisuallyHidden, icons and `cn`. Feature components go in `src/presentation/components/<feature>/`.
- **Server first:** pages are Server Components that load data with `getContainer()`. Add `"use client"` only for interactive leaves.
  - Entities are class instances and cannot cross the server/client boundary. Pass products to Client Components as a `ProductSnapshot` (`toProductSnapshot`), and rebuild them with `fromProductSnapshot` in `presentation/components/catalog/productSnapshot.ts`.
- **Money:** `Money` holds integer minor units (cents) and a currency. Use `add`, `subtract`, `multiply` and the comparisons; never do arithmetic on `.amount` (major units, for display and analytics only). Build values with `Money.fromMinor` or `Money.fromMajor`.
- **Pricing:** `PricingPolicy` is the single source of shipping and tax. The store's policy is `storePricingPolicy` in `src/infrastructure/config/pricingPolicy.ts`: standard 4,95 € (free from 75 €), express 9,95 €, overnight 14,95 €, 21 % IVA included.
  - Get the policy from `getContainer().getPricingPolicy()`.
  - Use `calculateOrderTotals`, `shippingCost` and `freeShippingThreshold` from `domain/entities/order/OrderPricing.ts`.
  - Never hardcode amounts or thresholds in copy.
- **Shipping region:** `NON_SHIPPABLE_POSTAL_PREFIXES` (`35`, `38`, `51`, `52`) in `application/checkout/validateCheckoutDetails.ts` is the only definition. Postal codes with these prefixes fail with `unsupportedRegion`.
- **Validation:** use cases throw `FormValidationError` (`application/errors.ts`), whose `fieldErrors` maps field paths (for example `customer.email` or `shippingAddress.postalCode`) to `ValidationCode`s: `required`, `invalidEmail`, `invalidPhone`, `invalidPostalCode`, `unsupportedRegion`, `tooShort`, `tooLong`. The UI maps these codes to copy with `validationMessage()` in `presentation/components/forms/validationMessages.ts`.
- **Domain errors:** `ValidationError`, `NotFoundError` and `BusinessRuleError` (with `code`: `MAX_QUANTITY_EXCEEDED`, `OUT_OF_STOCK`, `CURRENCY_MISMATCH`). The cart allows at most 99 units per product (`MAX_QUANTITY_PER_ITEM`).
- **Cart state:** use `useCart()` from `presentation/context/CartContext.tsx`. It is mounted in `app/Providers.tsx` together with `useNotifications()` and `useAnalytics()`/`useConsent()`.
  - `addItem` resolves `Promise<boolean>`.
  - `checkout()` resolves `Promise<boolean>`: true once navigation to the checkout has started.
- **Analytics:** track only events defined in the typed catalogue `src/application/analytics/events.ts`, through the `AnalyticsService` from `useAnalytics()`. Do not import `posthog-js` anywhere else. Add a new event to the catalogue first. Never put raw personal data (email, name, address) in event properties or ids: `identify` takes `pseudonymousCustomerId(email)` (`application/analytics/customerId.ts`, a SHA-256 hash).
  - Monetary properties are in major units with `currency`.
- **Consent:** analytics are gated on consent. `PostHogAnalyticsAdapter` drops every call and loads nothing until `setConsent(true)`, which happens after the visitor accepts the banner.
  - `ConsentDecision` is stored under `bugout.consent`, versioned by `CONSENT_VERSION`.
  - If you add any cookie or storage key, add it to the cookie table in `messages/content.ts`.
- **Accessibility and honesty:**
  - Give every control an accessible name, use one `<h1>` per page, and associate labels and errors with their fields.
  - Dialogs must trap focus, close on Escape and restore focus.
  - Respect `prefers-reduced-motion`.
  - No fabricated ratings, reviews, stock figures or success messages. `rating` is `null` when there is no review data.

## Environment variables

All variables are optional and `NEXT_PUBLIC_*`, so they are inlined at build time; rebuild after changing them. See `.env.example`.

| Variable | Default | Read in | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_COMMERCE_PROVIDER` | `local` | `infrastructure/config/appConfig.ts` | `local` or `shopify`; any other value throws `ConfigurationError` |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | none | `appConfig.ts` | Required for `shopify`, e.g. `store.myshopify.com` |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` | none | `appConfig.ts` | Required for `shopify`; public Storefront API token |
| `NEXT_PUBLIC_SHOPIFY_API_VERSION` | `2026-07` (`DEFAULT_SHOPIFY_API_VERSION` in `adapters/shopify/ShopifyClient.ts`) | `appConfig.ts` | Storefront API version |
| `NEXT_PUBLIC_POSTHOG_KEY` | none (analytics off, `NoopAnalyticsAdapter`) | `appConfig.ts` | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `/ingest` (set in `PostHogAnalyticsAdapter`) | `appConfig.ts` | PostHog ingestion host |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `presentation/config/site.ts` | Canonical origin (metadata, sitemap, robots, JSON-LD) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | hidden | `site.ts` | Support email on contact and legal pages |
| `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID`, `NEXT_PUBLIC_LEGAL_ADDRESS` | hidden | `site.ts` | Seller identity (LSSI) on legal pages |
| `E2E_PORT` / `E2E_SKIP_SERVER` / `CI` | `3100` / unset | `playwright.config.ts` | E2E server port, reuse a running server, CI mode |

Reference each env var literally as `process.env.NEXT_PUBLIC_X`; Next.js inlines only literal references. The simulated-delay setting (`simulatedDelayMs`) comes only from `AppConfig`, not from env.

## Testing

- Unit tests sit next to the code as `*.test.ts(x)` (Vitest, globals on, `@/` alias).
- The default environment is `node`. React component, context and hook tests opt into jsdom with `// @vitest-environment jsdom` on the **first line**, and use Testing Library (`vitest.setup.ts` loads jest-dom and cleans up).
- Test helpers: `domain/testing/` (`buildProduct`, `testPricingPolicy`), `application/testing/` (fakes, checkout details), `infrastructure/testing/` (`MemoryStorage`, Shopify fixtures). `fast-check` is available for property tests.
- Add or update tests with every behaviour change.
- E2E: Playwright specs belong in `e2e/`. They run against a production build, with `desktop` (Chrome 1440×900) and `mobile` (Pixel 7) projects, locale `es-ES`. `@axe-core/playwright` is installed for accessibility checks.
- CI (`.github/workflows/ci.yml`, Node 22) runs on pushes to `master` and on PRs: `npm ci`, lint, typecheck, `npm test`, build, `playwright install chromium`, `npm run e2e`. It uploads the Playwright report on failure.

## Known limitations / backend work pending

- Newsletter (`LocalNewsletterAdapter`) and contact (`LocalContactAdapter`) only simulate delivery after a short delay and send nothing. No backend is connected yet.
- The `local` checkout is a demo (`LocalOrderGateway`): no payment, no real order, nothing leaves the browser. The confirmation is kept in sessionStorage (`bugout.lastOrder`).
- `order_completed` is tracked client-side only, in `LocalCheckout`. Server-side tracking (Shopify order webhooks → PostHog) is pending, so Shopify purchases are not tracked yet.
- The legal identity env vars (`NEXT_PUBLIC_LEGAL_*`) must be set before launch; the LSSI requires them.
- Product photos: in the local catalog only the survival kits (backpacks) have a photo, and they share `public/images/products/backpack.png`. Accessories show a placeholder. Shopify will supply the real images.
- The Shopify API version default `2026-07` must stay within Shopify's supported window. Bump `DEFAULT_SHOPIFY_API_VERSION` or set the env var before it expires.
- With `shopify`, the shipping rates and taxes shown in the app still come from `storePricingPolicy`. Shopify's own shipping zones and rates must be configured to match, including excluding Canarias, Ceuta and Melilla.
