# Bugout architecture

Bugout is a Spanish-language (es-ES, EUR) storefront for survival kits built with Next.js 15 (App Router), React 19, TypeScript (strict) and Tailwind CSS 4. The code follows Clean Architecture: dependencies point inward only.

```
app/ (routes)  →  presentation/  →  application/  →  domain/
                                     ↑
                         infrastructure/ (adapters, DI container)
```

- **domain/** holds entities and value objects with invariants. No framework, no I/O.
- **application/** holds use cases, ports (interfaces), DTOs, pure query and validation helpers, and the analytics event catalogue.
- **infrastructure/** holds adapters implementing the ports (JSON catalog, localStorage, Shopify Storefront API, PostHog, simulated local services), env parsing, the pricing policy and the dependency container.
- **presentation/** holds React components, contexts, hooks, i18n copy and formatting, routes and site config.
- **app/** holds Next.js routes only: they fetch data through the container and render presentation components.

Imports use the `@/` alias throughout, with no relative `../` imports across folders. `domain` imports nothing outside itself, and `application` imports only `domain`. `app/` and `presentation/` never import adapters; they use the container from `@/infrastructure/config`.

## Commerce providers

`NEXT_PUBLIC_COMMERCE_PROVIDER` selects the backend (`local` by default):

| Concern | `local` | `shopify` |
|---|---|---|
| Catalog | `JsonProductAdapter` (`infrastructure/data/products.json`) | `ShopifyProductAdapter` (Storefront API; products that can't be mapped are skipped with a warning) |
| Cart | `LocalStorageCartAdapter` (key `bugout.cart`: ids and quantities, re-priced from the catalog on load; migrates the legacy `shopping-cart` key) | `ShopifyCartAdapter` (Shopify cart, line mutations; cart id in `bugout.shopify-cart-id`; a revision key `bugout.shopify-cart-rev` is bumped after every change so other tabs refresh their lines; a line priced in another currency throws `ShopifyApiError`) |
| Checkout | `LocalCheckoutAdapter` → in-app `/checkout` (demo, no payment) | `ShopifyCheckoutAdapter` → hosted Shopify checkout URL (reuses the remembered `checkoutUrl` of the current cart; creates a cart when there is none) |
| Orders | `LocalOrderGateway` (simulated, generates `BUG-XXXXXXXX` numbers); confirmation kept by `SessionStorageOrderConfirmationStore` (`bugout.lastOrder`) | Shopify (hosted checkout) |

Shopify env: `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` (public Storefront token) and optional `NEXT_PUBLIC_SHOPIFY_API_VERSION` (default `DEFAULT_SHOPIFY_API_VERSION` = `2026-07`). Selecting `shopify` without the first two throws `ConfigurationError` when the container is first built. `ShopifyClient` sends every query and mutation with `@inContext(country: ES, language: ES)`. Catalog queries are cached by Next.js with `revalidate: 300` seconds (`CATALOG_REVALIDATE_SECONDS`), and cart calls use `cache: 'no-store'`.

Newsletter (`LocalNewsletterAdapter`) and contact (`LocalContactAdapter`) use local adapters under both providers. They only simulate delivery until a mail/CRM backend is connected. `AppContainer.isMessagingSimulated()` returns `true` so the forms can show a demo notice and non-committal success copy.

## Dependency container

`getContainer()` (`infrastructure/config/container.ts`) lazily builds a singleton `AppContainer` from environment variables (`readConfigFromEnv()` → `parseConfig()`) on first use, on server and client alike. There is no explicit init call. Adapter and use-case instances are cached per container, so every use case shares the same repositories. Tests call `createContainer(config)` / `resetContainer()`.

`AppContainer` API used by `app/` and `presentation/`:

| Method | Returns |
|---|---|
| `getProvider()` | `CommerceProvider` (`'local' \| 'shopify'`) |
| `getPricingPolicy()` | `PricingPolicy` (`storePricingPolicy`: currency, shipping rates, tax) |
| `getGetProductsUseCase()` | `execute(): Promise<Product[]>` |
| `getGetProductBySlugUseCase()` | `execute(slug): Promise<Product>` (throws `NotFoundError`) |
| `getManageCartUseCase()` | `getCart / addToCart / setQuantity / deleteFromCart (whole line) / clearCart`, all resolving to the updated `Cart`. `addToCart` re-reads the product so the current price and stock apply |
| `getCreateCheckoutUseCase()` | `execute(): Promise<CheckoutSession>` (`dtos/Checkout.ts`: `{ url, type: 'local' \| 'hosted' }`). Throws `ValidationError` for an empty cart. `hosted` must be an absolute `https://` URL (required for Shopify) and `local` a single-slash in-app path; anything else throws |
| `getPlaceOrderUseCase()` | `execute(details: CheckoutDetails): Promise<OrderConfirmation>` (`dtos/Order.ts`). Throws `FormValidationError` for invalid fields and `ValidationError` for an empty cart; clears the cart on success |
| `getSubscribeNewsletterUseCase()` | `execute(email): Promise<void>` (throws `FormValidationError`) |
| `getSendContactMessageUseCase()` | `execute(message: ContactMessage): Promise<void>` (throws `FormValidationError`) |
| `isMessagingSimulated()` | `true` while newsletter and contact use the simulated local adapters |
| `getAnalyticsService()` | `AnalyticsService` (`PostHogAnalyticsAdapter` when `NEXT_PUBLIC_POSTHOG_KEY` is set, otherwise `NoopAnalyticsAdapter`) |
| `getConsentRepository()` | `ConsentRepository` (`LocalStorageConsentRepository`, key `bugout.consent`) |
| `getOrderConfirmationStore()` | `OrderConfirmationStore` port (`save / load / clear`, never throws): `SessionStorageOrderConfirmationStore`, key `bugout.lastOrder`. It strictly validates stored data and returns `null` for anything invalid |
| `getSyncedStorageKeys()` | `{ cart: ['bugout.cart', 'bugout.shopify-cart-id', 'bugout.shopify-cart-rev'], consent: 'bugout.consent' }`, the only keys whose `storage` events other tabs react to. The constants are exported from their adapters |

Pure helpers:
- `application/catalog/`: `applyFilterCriteria(products, criteria)`, `summarizeCategories(products)` and `priceBounds(products)`. Sort options are `featured | price-asc | price-desc | rating | reviews`.
- `application/checkout/`: `validateCheckoutDetails(details, 'contact' | 'shipping' | 'all')`, `isValidSpanishPhone`, `isShippablePostalCode`, `NON_SHIPPABLE_POSTAL_PREFIXES`, `SHIPPING_COUNTRY` (`'ES'`), and `SHIPPABLE_PROVINCES` / `provinceForPostalCode(code)` (`provinces.ts`).

`FormValidationError` (`application/errors.ts`) carries `fieldErrors: Record<string, ValidationCode>`, keyed by field path (e.g. `customer.email`). `ValidationCode` is `'required' | 'invalidEmail' | 'invalidPhone' | 'invalidPostalCode' | 'unsupportedRegion' | 'postalCodeMismatch' | 'tooShort' | 'tooLong'`. The UI maps codes to copy (`presentation/components/forms/validationMessages.ts`).

## Domain rules

- `Money` is integer minor units plus an ISO currency. Never do arithmetic on `amount` (major units, for display and analytics); use `add`, `subtract`, `multiply` and so on. `discountPercentage(price, original)` (same file) is the one discount calculation, used by `Product.discountPercentage()` and `PriceTag`. `SHIPPING_METHOD_IDS` / `isShippingMethodId()` (`OrderPricing.ts`) list the valid shipping-method ids.
- `Cart` (`addItem`, `setQuantity`, `deleteItem`, `clear`) holds at most `MAX_QUANTITY_PER_ITEM` (99) per product and rejects out-of-stock products and mixed currencies. Violations throw `BusinessRuleError` with a `code` (`MAX_QUANTITY_EXCEEDED`, `OUT_OF_STOCK`, `CURRENCY_MISMATCH`).
- `Product.slug` is the URL handle. `Product.id` is the backend id (a Shopify variant GID when Shopify is active). Product JSON-LD omits `image` when there are no images and omits `sku` for Shopify GIDs.
- `rating` is `null` when there is no review data, which is true of every product in the demo catalog. `RatingStars`, the JSON-LD `aggregateRating` and the rating and reviews sort options appear only when a product has reviews (`hasReviews()`), for example from Shopify `reviews.*` metafields.
- Shipping and tax come only from `PricingPolicy` (`calculateOrderTotals`, `shippingCost`, `freeShippingThreshold` in `domain/entities/order/OrderPricing.ts`). The store policy (`infrastructure/config/pricingPolicy.ts`) has three rates and 21 % IVA included:
  - standard 4,95 €, free from 75 €
  - express 9,95 €
  - overnight 14,95 €

  Never hardcode thresholds in UI copy.
- Shipping region: Spain only, meaning the peninsula and the Balearics. Postal codes starting with a prefix in `NON_SHIPPABLE_POSTAL_PREFIXES` (`35`, `38`, `51`, `52`: Las Palmas, Santa Cruz de Tenerife, Ceuta, Melilla) fail validation with `unsupportedRegion`, because prices include IVA. Postal-code checks run in the order `required` → `invalidPostalCode` → `unsupportedRegion` → `postalCodeMismatch`; the last means the code belongs to a different province than the one selected.

## Presentation conventions

- **Copy:** short UI copy lives in `presentation/i18n/messages/<area>.ts` (Spanish), and components read `messages.<area>.<key>`. Long-form prose lives in the page components: the legal and shipping pages (`app/{privacy,cookies,terms,shipping-returns}/page.tsx`, rendered with `LegalPage` / `Prose`) and `app/about/page.tsx`. Use `ContactChannel` (`presentation/components/content/`) whenever copy tells customers how to reach the shop: it shows the email when configured and otherwise the contact form, and makes no reply promise while messaging is simulated. Shipping-method names come only from `messages.common.shippingMethods`. Format prices with `formatMoney` and map errors with `toUserMessage`.
- **Routes:** build links with `presentation/routes.ts` (`routes`, `catalogUrl`). Don't link to pages that don't exist.
- **Colors:** use theme tokens from `globals.css` (`bg-navy`, `text-accent`, `bg-accent`, `border-sand`, …), not raw hex.
  - Orange buttons use `bg-accent`; white text on it passes WCAG AA.
  - Orange text on navy uses `text-orange-on-navy`.
  - `orange` is decorative only.
- **Components:** reuse the primitives in `presentation/components/ui`: Button, ButtonLink, IconButton, Container, PageHeader, Breadcrumbs, Drawer, TextField, TextAreaField, SelectField, CheckboxField, RadioGroupField, PriceTag, RatingStars, ProductBadge, Spinner, VisuallyHidden and icons. Feature components live in `presentation/components/<feature>/`.
- **State:** three providers are mounted once in `app/Providers.tsx`:
  - `CartProvider` (`useCart`):
    - `addItem(...)` resolves `Promise<boolean>` and shows no success toast; the opening drawer is the confirmation.
    - `checkout({ replace?: boolean })` resolves `Promise<boolean>`, true once navigation to the local route or hosted URL has started. `/checkout` hands off to Shopify with `replace: true` (`location.replace`), so Back doesn't bounce into the hosted checkout, and it recovers when restored from the back/forward cache (`pageshow`).
    - `loadError` flags a failed cart restore; `CheckoutFlow` shows it with a retry.
    - `runExclusive(task)` runs work inside the cart mutation queue and then reloads the cart; the local checkout places orders this way.
    - Only visitor-initiated opens track `cart_viewed`.
    - `storage` events reload the cart only for `getSyncedStorageKeys().cart`.
  - `NotificationProvider` (`useNotifications`).
  - `AnalyticsProvider` (`useAnalytics`, `useConsent`) restores the stored consent in a `useLayoutEffect`, so mount-time events such as `product_viewed` are not dropped. It also applies consent changes made in other tabs (`getSyncedStorageKeys().consent`).
    - `useConsent()` returns `decision`, `ready`, `accept`, `reject`, `reopen(returnFocusTo?)`, `dismiss()`, `isBannerOpen` and `reopenRequest`.
    - A reopened banner focuses its first button. Escape (or `dismiss()`) closes it without changing the decision and returns focus.
    - The banner reserves its height with an in-flow spacer.
- **Server first:** pages are Server Components that load data via the container; only interactive parts are Client Components. Entities can't cross into Client Components, so pages pass a plain `ProductSnapshot` (`toProductSnapshot`) and the client rebuilds the entity with `fromProductSnapshot` (`presentation/components/catalog/productSnapshot.ts`). Other server-side behaviour:
  - The home page, product pages and `sitemap.ts` export `revalidate = 300`.
  - The root layout loads the catalog once and passes its categories to the header, mobile menu and footer.
  - `/products` parses filters with `parseCatalogSearchParams(input, { categories })`. Unknown categories are ignored, and the page is `noindex` for them. The catalog view syncs filters back to the URL with `window.history.replaceState` (no navigation).
  - The order confirmation view sets the tab title.
  - `CopyrightNotice` is a small client component that updates the year after hydration.
  - `siteConfig.url` resolves to `NEXT_PUBLIC_SITE_URL`, then `https://$VERCEL_PROJECT_PRODUCTION_URL`, then `http://localhost:3000` (a bare host gets `https://`), and warns in production builds when it falls back. It is only correct on the server.
- **Accessibility:**
  - Every control has an accessible name.
  - Dialogs trap focus, close on Escape and restore focus.
  - Form fields have associated labels, with error text linked via `aria-describedby`.
  - One `<h1>` per page.
  - Motion respects `prefers-reduced-motion`.
- **Honesty:** no fabricated ratings, reviews, stock or marketing figures, and no success messages for actions that did nothing.

## Analytics

Events are typed in `application/analytics/events.ts` and sent only through `AnalyticsService` (`track`, `captureException`, `setConsent(granted, origin)`). There is no `identify`: events never carry personal data. Checkout containers that show customer data have the `ph-no-capture` class, so autocapture skips them.

`PostHogAnalyticsAdapter` does nothing on the server and drops every call until consent is granted. `ConsentOrigin` distinguishes the two ways that happens:
- `'visitor'`: the visitor clicks Accept, and exactly one `$opt_in` event is sent;
- `'restored'`: a stored decision is re-applied on page load or synced from another tab, and the SDK opts in silently, with no `$opt_in` per page load. After consent, the adapter:
- imports `posthog-js` on demand and initialises it with `opt_out_persistence_by_default`, `disable_session_recording` and `advanced_disable_flags`;
- queues up to 100 calls while the SDK loads and replays them after init;
- never throws into callers.

Withdrawing consent:
1. clears the queue;
2. calls `reset()` and then `opt_out_capturing()`, in that order, because `reset()` also clears the stored opt-out;
3. removes every leftover `ph_*` / `__ph_opt_in_out_*` storage entry, except `__ph_opt_in_out_<key>` = `"0"`, which keeps later inits opted out;
4. expires PostHog cookies for the host and each parent domain (`cookieDomainsFor`, e.g. `www.bugout.es` → `bugout.es`), because the SDK writes cross-subdomain cookies.

Before consent nothing is sent and no analytics cookies are written. The consent decision is versioned (`CONSENT_VERSION`); stored decisions from another version count as undecided. `PostHogAnalyticsAdapter.sdk.test.ts` checks this against the real SDK, and `PostHogAnalyticsAdapter.cookies.test.ts` covers the cookie domains.

PostHog is proxied through `/ingest` to the EU region (see `next.config.ts`). A custom absolute `NEXT_PUBLIC_POSTHOG_HOST` is also supported. `next.config.ts` exports `contentSecurityPolicy(env)` and `posthogOrigins(host)`. The production CSP allows same-origin scripts and connections, the Shopify store domain in `connect-src`, and an absolute PostHog host in `script-src` and `connect-src` (plus the matching `-assets` host for `*.i.posthog.com`). Third-party toolbars (Vercel, PostHog) don't load in production. Env: `NEXT_PUBLIC_POSTHOG_KEY`, optional `NEXT_PUBLIC_POSTHOG_HOST` (default `/ingest`).

`order_completed` is tracked client-side by the local checkout only. Server-side tracking of Shopify orders (webhooks → PostHog) is not built yet.

## Testing

- `npm test`: Vitest covering domain, application and infrastructure (node environment) plus React components, contexts and hooks (jsdom via a first-line `// @vitest-environment jsdom` docblock, Testing Library).
- `npm run e2e`: Playwright end-to-end tests (`e2e/`) against a production build (`npm run build` first).
- `npm run lint`, `npm run typecheck`, `npm run build`: all must pass. CI runs `npm ci`, lint, typecheck, `npm test`, build, `npx playwright install --with-deps chromium` and `npm run e2e`.
