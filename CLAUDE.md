# Bugout — agent and developer guide

Keep this file accurate: update it in the same change as the code it describes. Verify claims against the code; do not document intentions as facts.

## What this is

Bugout is a Spanish online shop for survival backpacks and emergency gear, built with Next.js 15 (App Router), React 19, TypeScript (strict) and Tailwind CSS 4. The UI and all copy are Spanish (`es-ES`), prices are in EUR and include 21 % IVA. It ships to Spain only, meaning the peninsula and the Balearic Islands. Canarias, Ceuta and Melilla are rejected at checkout.

The shop is built around three **kits** (Kit 24h and Kit 72h, each sold for 1, 2 or 4 people as variants, and the build-your-own Kit Custom) plus the **loose products** they contain. The visual design (Montserrat, sand/navy/orange, pill buttons; the pixel-art frog mascot is kept in the code but hidden) was ported from a partner's static prototype (`chuan-samon-repositories/bug-out`); this repo is now the source of truth. See [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

`NEXT_PUBLIC_COMMERCE_PROVIDER` selects one of two commerce backends:
- `local` (default): the catalog bundled in `src/infrastructure/data/products.json`, a localStorage cart and an in-app demo checkout that places no real order.
- `shopify`: the Shopify Storefront API for catalog and cart, with Shopify's hosted checkout. Store setup (settings, metafields, products, tokens) is in [docs/SHOPIFY_SETUP.md](docs/SHOPIFY_SETUP.md).

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
src/presentation/   components/<feature>/ (home, kits, catalog, cart, checkout, layout, ...), components/ui/ (design system), context/, hooks/, i18n/, routes.ts, config/ (site, brand, messaging)
src/application/    use-cases/, ports/ (interfaces), dtos/, catalog/ (filters, kits.ts) + checkout/ (pure helpers), analytics/events.ts, errors.ts
src/domain/         entities (Product, Cart, CartItem, OrderPricing), value-objects (Money, ProductId, Quantity), errors
src/infrastructure/ adapters/ (json, localStorage, shopify, posthog, local simulated services), config/ (AppContainer, env, pricing), data/
```

- `domain` imports nothing outside itself. `application` imports only `domain`. Imports use `@/` everywhere, not relative `../` paths across folders.
- `app/` and `presentation/` reach infrastructure only through `@/infrastructure/config` (`getContainer()`), never adapters directly.
- `getContainer()` lazily builds a singleton `AppContainer` from env on first use, on server and client alike. There is no init call. Tests use `createContainer(config)` / `resetContainer()`.
- Imports use the `@/` alias for `src/`.

## Conventions agents must follow

- **Copy:** short UI copy (labels, buttons, messages, errors, metadata) lives in `src/presentation/i18n/messages/<area>.ts` (areas: common, errors, shell, catalog, cart, checkout, forms, content) and is read as `messages.<area>.<key>`. Do not hardcode UI strings in components.
  - Long-form prose lives in the page components. The legal and shipping pages (`src/app/{privacy,cookies,terms,shipping-returns}/page.tsx`) render it with `LegalPage` and `Prose` from `presentation/components/content/`, and the about page keeps its own text in `src/app/about/page.tsx`.
  - The copy of `/how-to-choose`, `/why-prepare` and `/faq` is in `messages.content.{howToChoose,whyPrepare,faqPage}`; their kit facts (names, people options, who each kit is for) come from the catalog.
  - Shipping-method names come only from `messages.common.shippingMethods`.
  - To tell customers how to reach the shop, use `ContactChannel` (`presentation/components/content/ContactChannel.tsx`). It says "escríbenos a <email>" when `NEXT_PUBLIC_CONTACT_EMAIL` is set, otherwise "escríbenos a través del formulario de contacto" (with `?topic=`) when messaging is enabled, and otherwise "visita nuestra página de contacto" (a plain link to `routes.contact`, never mentioning a form).
  - `canPromiseReply()` is true when a message really reaches the shop (an email is configured or messaging is enabled). Copy that promises a reply, invites people to write, or answers "write to us" (the about CTA and "Contactar" button, the contact-page intro, the wholesale and order-status FAQ items) is shown only when it is true.
- **Formatting and errors:** format prices with `formatMoney` (plus `formatNumber`, `formatRating`, `formatDate`) from `@/presentation/i18n`. Turn thrown errors into user text with `toUserMessage(error, { productName })`. Never show `error.message`.
- **Links:** build URLs from `src/presentation/routes.ts`, using `routes.*` (including `howToChoose`, `whyPrepare`, `faq`) and `catalogUrl({ category, sort, priceMin, priceMax, inStock, onSale })`. Do not hardcode paths or link to pages that do not exist. Kits live at `routes.product(slug)` like any product.
- **Design system:** follow [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md). In short:
  - Montserrat (`next/font`, variable on `<html>`); a sand page (`bg-sand`) with white cards (`rounded-2xl bg-white shadow-card`); navy heroes, header and footer; container `max-w-site` (via `Container`).
  - Pages open with `PageHeader` (default `tone="hero"`, a full-width navy banner rendered outside any `Container`; `tone="plain"` for checkout). Sections open with `SectionHeading` / `Eyebrow`.
  - The header is `fixed`: transparent over the home hero until scrolled, solid elsewhere. `main` is offset by `--header-height`; the home hero slides under the header.
  - Brand art and the frog are in `public/images/brand|mascot/` (paths via `brandAssets` in `presentation/config/brand.ts`). Product photos are `public/images/products/<slug>.jpg`, shot on navy.
  - Motion (`Reveal`, `FrogMascot`, hover lifts) is decorative and stops under `prefers-reduced-motion`.
  - The frog mascot is **hidden**: it has no interaction with the visitor, so it is decoration only. `isMascotEnabled()` in `presentation/config/mascot.ts` (`MASCOT_ENABLED = false`) is the one switch, like `isMessagingEnabled()`. Its component, sprite, CSS and images stay in the code; gate any new use of `FrogMascot` or `brandAssets.frog` on it.
  - `cn()` does not merge Tailwind classes: never override a primitive's display or colour through `className`. Wrap it instead.
- **Colors:** use the theme tokens in `src/app/globals.css` (`navy`, `navy-deep`, `navy-darker`, `sand`, `sand-dim`, `sand-line`, `orange`, `orange-hover`, `orange-deep`, `orange-on-navy`, `accent`, `accent-hover`, `accent-soft`, `ink`, `muted`, `danger`, `success`), never raw hex.
  - Contrast (WCAG AA) is enforced by `src/app/contrast.test.ts`; add any new text/background pair there.
  - Orange buttons, chips and badges are `bg-orange` with `text-navy-deep`. White text on orange fails AA.
  - Use `accent` for orange-family links or text on light backgrounds (white, sand, sand-dim), and `orange-on-navy` for orange text on navy.
- **Components:** reuse the primitives in `src/presentation/components/ui`: Button (`primary`, `secondary`, `ghost`, `danger`, `inverse`, `outline-inverse`), ButtonLink, IconButton, Container, PageHeader, Breadcrumbs, Eyebrow, SectionHeading, Reveal, FrogMascot, Drawer (`tone="dark"`), TextField, TextAreaField, SelectField, CheckboxField, RadioGroupField, PriceTag, RatingStars, ProductBadge, Spinner, VisuallyHidden, `textLinkClasses`, icons and `cn`. Feature components go in `src/presentation/components/<feature>/`; kit UI (KitCard, KitComparisonTable, KitContents, KitGallery, PurchasePanel, VariantSelector) is in `kits/`.
- **Server first:** pages are Server Components that load data with `getContainer()`. Add `"use client"` only for interactive leaves.
  - Entities are class instances and cannot cross the server/client boundary. Pass products to Client Components as a `ProductSnapshot` (`toProductSnapshot`), and rebuild them with `fromProductSnapshot` in `presentation/components/catalog/productSnapshot.ts`.
  - The home page, product pages, `/how-to-choose`, `/why-prepare`, `/faq` and `sitemap.ts` export `revalidate = 300`.
  - The root layout loads the catalog once and passes `navData(products)` (the kits, and the flagship kit with the most contents for "Compra ahora") to the header, mobile menu and footer.
  - `/products` reads its filters with `parseCatalogSearchParams(input, { categories })`. Unknown categories are ignored, and the page is `noindex` for them.
  - `siteConfig.url` is only correct on the server; use it from Server Components, metadata and route handlers.
- **Catalog model (kits and variants):**
  - `Product.id`, `price`, `originalPrice` and `inStock` describe the **selected variant**; `Product.variants` lists them all (a plain product has one implicit variant). Build multi-variant products with `Product.fromVariants(base, variants, selectedId?)` (default: first in stock) and switch with `withVariant(id)`.
  - Use `variantTitle` ("2 personas", null without options) and `displayName` ("Kit 72h · 2 personas") for cart and order lines, and `hasVariants()` / `priceRange()` / `hasPriceRange()` for chips and "Desde" prices.
  - Cart lines are keyed by variant id; every `ProductRepository.findById` resolves a variant id to its product with that variant selected (`findByVariantId` in `application/catalog/kits.ts`).
  - A product is a kit when `details.kit` (`KitInfo`: `label`, optional `idealFor`, `buildYourOwn`) is set. `details.contents[].productSlug` links a kit line to a catalog product; `details.related` lists cross-sell slugs. `parseCatalog` rejects references to unknown slugs.
  - Use the helpers in `application/catalog/kits.ts` (`kitsIn`, `looseProductsIn`, `comparableKits`, `kitsContaining`, `includedInIndex`, `resolveContents`, `relatedProducts`, `compareKits`); never store "included in" data.
  - Category slugs are the slugified Spanish Shopify product types: `kits`, `agua`, `comida`, `luz-y-energia`, `primeros-auxilios`, `refugio-y-abrigo`, `herramientas`, `higiene` (labels in `messages.catalog.categories`).
  - Shopify: variants come from `variants(first: 20)` with `selectedOptions` (option `Personas`), and kits from the `custom.kit` (JSON), `custom.related` (list of handles) and `custom.contents` (`handle` per line) metafields. See docs/SHOPIFY_SETUP.md.
- **Money:** `Money` holds integer minor units (cents) and a currency. Use `add`, `subtract`, `multiply` and the comparisons; never do arithmetic on `.amount` (major units, for display and analytics only).
  - Build values with `Money.fromMinor` or `Money.fromMajor`.
  - Discounts come from `discountPercentage(price, original)` in `domain/value-objects/Money.ts`.
  - Shipping-method ids come from `SHIPPING_METHOD_IDS` / `isShippingMethodId()` in `domain/entities/order/OrderPricing.ts`.
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
  - `addItem(product, quantity, source?)` resolves `Promise<boolean>`; `product` is resolved to the variant being bought and `source` is `product_page` (default), `product_card` (the card's quick add) or `cart_drawer`. It shows no success toast: the cart drawer opening is the confirmation. Only failures show an error toast.
  - `checkout({ replace?: boolean })` resolves `Promise<boolean>`, true once navigation has started. `/checkout` hands off to Shopify with `replace: true` (`location.replace`) and recovers when the page is restored from the back/forward cache.
  - `loadError` is true when restoring the cart failed; `refresh()` retries.
  - Any other operation that must not interleave with cart mutations goes through `runExclusive(task)`. For example, the local checkout places its order this way.
  - Cross-tab sync listens only to `getContainer().getSyncedStorageKeys()`: `cart` = `bugout.cart`, `bugout.shopify-cart-id` and `bugout.shopify-cart-rev`; `consent` = `bugout.consent`. The key constants are exported from their adapters. Never hardcode storage keys.
  - The last order confirmation goes through `getContainer().getOrderConfirmationStore()` (sessionStorage `bugout.lastOrder`, strictly validated on load).
- **Analytics:** track only events defined in the typed catalogue `src/application/analytics/events.ts`, through the `AnalyticsService` from `useAnalytics()`. Do not import `posthog-js` anywhere else. Add a new event to the catalogue first.
  - `AnalyticsService` has only `track`, `captureException` and `setConsent(granted, origin)`; there is no `identify`.
  - `origin` is a `ConsentOrigin`: `'visitor'` for a fresh Accept or Reject (a visitor Accept sends one `$opt_in`), or `'restored'` for a stored or other-tab decision (opts in silently).
  - Never send personal data (names, emails, phones, addresses, free text) in events.
  - Mark containers that show customer data with the `ph-no-capture` class.
  - Monetary properties are in major units with `currency`. Product events carry `product_id` (the variant id) and `variant_title`.
- **Consent:** analytics are gated on consent. `PostHogAnalyticsAdapter` drops every call and loads nothing until `setConsent(true, origin)`: after the visitor accepts the banner, or when a stored grant is restored. Withdrawal resets and opts out, then deletes PostHog storage and cookies (host and parent domains, `cookieDomainsFor`), keeping only `__ph_opt_in_out_<key>="0"`.
  - `AnalyticsProvider` restores a stored decision in a layout effect, before children track on mount, and syncs consent across tabs.
  - `useConsent()` offers `accept`, `reject`, `reopen(returnFocusTo?)`, `dismiss()` and `reopenRequest`. A reopened banner focuses its first button, and Escape closes it without changing the decision.
  - The banner reserves its height with a spacer so it never covers page content.
  - `ConsentDecision` is stored under `bugout.consent`, versioned by `CONSENT_VERSION`.
  - If you add any cookie or storage key, add it to the cookie table in `messages/content.ts`.
- **Messaging (newsletter and contact form):** hidden while their adapters only simulate delivery, not deleted, so they reappear once a real backend exists. `isMessagingEnabled()` in `presentation/config/messaging.ts` (`!getContainer().isMessagingSimulated()`) is the one switch; never read `isMessagingSimulated()` elsewhere in the UI. While it is false:
  - the home page has no `NewsletterSection` and the footer has no "Recibe novedades" band;
  - `/contact` renders no `ContactForm` and ignores `?topic=`: the FAQ (`ContactFaq`) sits beside the quick help (`ContactHelp`);
  - the local checkout does not offer the marketing opt-in (`marketingOptIn` stays `false`), so the review step never mentions it;
  - the privacy policy leaves out the contact-form and newsletter processing purposes.
  - `NewsletterForm` and `ContactForm` have no demo mode: they are rendered only when messaging is enabled, so their success copy is the real one.
- **Accessibility and honesty:**
  - Give every control an accessible name, use one `<h1>` per page, and associate labels and errors with their fields.
  - Dialogs must trap focus, close on Escape and restore focus.
  - Respect `prefers-reduced-motion`.
  - No fabricated ratings, reviews, stock figures, statistics, guarantees or success messages. Trust-bar and FAQ facts come from the pricing policy, `siteConfig` or the catalog. The partner prototype's unverified claims (5-year warranty, "24–48h" delivery, "+40.000 kits", "4,9/5") must not come back. The demo catalog has no ratings (`rating: null`), so the rating UI, JSON-LD `aggregateRating` and the rating and reviews sort options appear only when real review data exists (for example, Shopify `reviews.*` metafields).
  - Product JSON-LD omits `image` when a product has none and omits `sku` for Shopify GIDs.

## Environment variables

See `.env.example`. `NEXT_PUBLIC_*` values are inlined at build time; rebuild after changing them. The app runs locally with none set, but the LSSI variables below must be set before launch.

| Variable | Default | Read in | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_COMMERCE_PROVIDER` | `local` | `infrastructure/config/appConfig.ts` | `local` or `shopify`; any other value throws `ConfigurationError` |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | none | `appConfig.ts`, `next.config.ts` (CSP `connect-src`) | Required for `shopify`, e.g. `store.myshopify.com` |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` | none | `appConfig.ts` | Required for `shopify`; public Storefront API token |
| `NEXT_PUBLIC_SHOPIFY_API_VERSION` | `2026-07` (`DEFAULT_SHOPIFY_API_VERSION` in `adapters/shopify/ShopifyClient.ts`) | `appConfig.ts` | Storefront API version |
| `NEXT_PUBLIC_POSTHOG_KEY` | none (analytics off, `NoopAnalyticsAdapter`) | `appConfig.ts` | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `/ingest` (set in `PostHogAnalyticsAdapter`) | `appConfig.ts`, `next.config.ts` (CSP) | PostHog ingestion host. An absolute host is supported: `posthogOrigins()` adds it to CSP `script-src` and `connect-src`, plus the `-assets` host for `*.i.posthog.com` |
| `NEXT_PUBLIC_SITE_URL` | see next row | `presentation/config/site.ts` | Canonical origin (metadata, sitemap, robots, JSON-LD) |
| `VERCEL_PROJECT_PRODUCTION_URL` | set by Vercel | `site.ts` | Fallback origin `https://<value>`, then `http://localhost:3000`. A production build warns when neither is set. A bare host in `NEXT_PUBLIC_SITE_URL` gets `https://` added |
| `VERCEL_ENV` | set by Vercel; unset elsewhere | `site.ts` (`isIndexableDeployment` → `siteConfig.indexable`), `next.config.ts` (`robotsHeaders`) | Anything but `production` (the test site, previews) sends `X-Robots-Tag: noindex, nofollow` and a `robots.txt` that disallows everything. Unset (local, CI) is indexable |
| `NEXT_PUBLIC_CONTACT_EMAIL` | hidden when unset | `site.ts` | **Required before launch (LSSI).** Support email on contact and legal pages, and via `ContactChannel` |
| `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID`, `NEXT_PUBLIC_LEGAL_ADDRESS` | hidden when unset | `site.ts` | **Required before launch (LSSI).** Seller identity on legal pages |
| `E2E_PORT` / `E2E_SKIP_SERVER` / `CI` | `3100` / unset | `playwright.config.ts` | E2E server port, reuse a running server, CI mode |

Reference each env var literally as `process.env.NEXT_PUBLIC_X`; Next.js inlines only literal references. The simulated-delay setting (`simulatedDelayMs`) comes only from `AppConfig`, not from env.

## Testing

- Unit tests sit next to the code as `*.test.ts(x)` (Vitest, globals on, `@/` alias).
- The default environment is `node`. React component, context and hook tests opt into jsdom with `// @vitest-environment jsdom` on the **first line**, and use Testing Library (`vitest.setup.ts` loads jest-dom and cleans up).
- `PostHogAnalyticsAdapter.sdk.test.ts` runs the real `posthog-js` SDK to check consent, opt-out and storage cleanup, and `PostHogAnalyticsAdapter.cookies.test.ts` covers cookie removal on parent domains. Keep both passing when you touch analytics.
- Test helpers: `domain/testing/` (`buildProduct`, `testPricingPolicy`), `application/testing/` (fakes, checkout details), `infrastructure/testing/` (`MemoryStorage`, Shopify fixtures). `fast-check` is available for property tests.
- Add or update tests with every behaviour change.
- `src/app/contrast.test.ts` checks the theme's text/background pairs against WCAG AA.
- E2E: Playwright specs live in `e2e/` (smoke, navigation, catalog, kits, cart, purchase, forms, consent, a11y) with shared helpers in `e2e/support/` (`site.ts` mirrors the catalog: `PRODUCTS`, `KITS`, `CATEGORY_COUNTS`, `variantName`).
  - They run against a production build, with `desktop` (Chrome 1440×900) and `mobile` (Pixel 7) projects, locale `es-ES` and `prefers-reduced-motion: reduce` (`contextOptions`).
  - Accessibility checks use `@axe-core/playwright`.
- CI (`.github/workflows/ci.yml`, Node 22) runs on pushes to `master` and `develop` and on PRs: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run e2e`. It uploads the Playwright report on failure.
- Deployment is Vercel's Git integration, not CI: `master` deploys to production (`bugout.es`), `develop` to the test site `test.bugout.es` (a Preview domain bound to that branch, not access-protected but kept out of search engines via `VERCEL_ENV`). See README "Deployment notes".

## Known limitations / backend work pending

- Newsletter (`LocalNewsletterAdapter`) and contact (`LocalContactAdapter`) only simulate delivery after a short delay and send nothing. `isMessagingSimulated()` returns `true`, so `isMessagingEnabled()` is false and the newsletter, the contact form and the checkout marketing opt-in are hidden. No backend is connected yet. Connecting one means wiring real adapters in `AppContainer` and making `isMessagingSimulated()` return `false`; the UI then shows them again.
- With messaging hidden and no `NEXT_PUBLIC_CONTACT_EMAIL`, the site offers no way to reach the shop: `ContactChannel` links to `/contact`, which shows only the quick help and FAQ. Set the email before launch.
- The `local` checkout is a demo (`LocalOrderGateway`): no payment, no real order, nothing leaves the browser. The confirmation is kept in sessionStorage (`bugout.lastOrder`, via `OrderConfirmationStore`).
- `order_completed` is tracked client-side only, in `LocalCheckout`. Server-side tracking (Shopify order webhooks → PostHog) is pending, so Shopify purchases are not tracked yet.
- `NEXT_PUBLIC_CONTACT_EMAIL` and the legal identity vars (`NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID`, `NEXT_PUBLIC_LEGAL_ADDRESS`) are required before launch (LSSI). Unset fields are simply hidden, so nothing fails loudly if they are missing. Until the contact backend exists, the email is the only real channel.
- Product photos: every loose product in the local catalog has its own photo (`public/images/products/<slug>.jpg`). The kits have none yet: their pages show a "Foto del kit cerrado próximamente" box plus their contents' photos, and cards show the kit label on a navy gradient. Shopify will supply the real images; `cdn.shopify.com` is allowed in `next.config.ts`.
- The demo catalog's prices, weights, dimensions and kit contents are the partner prototype's placeholders, not confirmed business data. Replace them (in Shopify or `products.json`) before selling.
- The Kit Custom has no in-page product picker: its page explains the idea, and the visitor adds loose products from the catalog separately.
- "Control de caducidades" (the trust bar and FAQ say "te avisamos para renovar los consumibles") was confirmed as a real service by the business, but no reminder system exists in the code.
- The Shopify API version default `2026-07` must stay within Shopify's supported window. Bump `DEFAULT_SHOPIFY_API_VERSION` or set the env var before it expires.
- Shopify shipping zones and rates must be configured to match `storePricingPolicy`, including excluding Canarias, Ceuta and Melilla. The app quotes shipping and tax from that policy, while Shopify's hosted checkout charges its own.
  - The Shopify market for Spain must sell in EUR; a cart priced in another currency throws `ShopifyApiError`.
- Strike-through prices (`originalPrice`) must follow the EU/Spanish price-reduction rule: the reference price must be the lowest price of the previous 30 days. The code cannot check this; it is the business's responsibility when setting prices.
- The production Content-Security-Policy (`next.config.ts`) blocks third-party scripts. Vercel's toolbar and PostHog's toolbar won't load in production.
