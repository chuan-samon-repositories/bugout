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
| Catalog | `JsonProductAdapter` (`infrastructure/data/products.json`, in file order; `findById` resolves variant ids with `findByVariantId`) | `ShopifyProductAdapter` (Storefront API; sorted by the `custom.position` metafield, lowest first, products without it after in Shopify's order; products that can't be mapped or are priced in a currency other than `storePricingPolicy.currency` are skipped with a warning; `findById` is a GraphQL `node` lookup of the variant GID) |
| Cart | `LocalStorageCartAdapter` (key `bugout.cart`: ids and quantities, re-priced from the catalog on load, dropping and reporting now out-of-stock lines; migrates the legacy `shopping-cart` key) | `ShopifyCartAdapter` (Shopify cart, line mutations; cart id in `bugout.shopify-cart-id`; a revision key `bugout.shopify-cart-rev` is bumped after every change so other tabs refresh their lines; `save` resolves to the cart the last mutation returned, since Shopify lowers quantities to the stock and leaves sold-out merchandise out (with `warnings`, which are requested and, apart from stock ones, logged); lines it can't map on load are dropped and reported; a line priced in another currency throws `ShopifyApiError`) |
| Checkout | `LocalCheckoutAdapter` → in-app `/checkout` (demo, no payment) | `ShopifyCheckoutAdapter` → hosted Shopify checkout URL (writes the visit's analytics attribution onto the cart with `cartAttributesUpdate` and asks for `checkoutUrl` in the visitor's consent context; creates a cart when there is none or it expired) |
| Orders | `LocalOrderGateway` (simulated, generates `BUG-XXXXXXXX` numbers); confirmation kept by `SessionStorageOrderConfirmationStore` (`bugout.lastOrder`) | Shopify (hosted checkout) |

Shopify env: `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` (public Storefront token) and optional `NEXT_PUBLIC_SHOPIFY_API_VERSION` (default `DEFAULT_SHOPIFY_API_VERSION` = `2026-07`). Selecting `shopify` without the first two throws `ConfigurationError` when the container is first built, and so does a token that starts with a secret Shopify prefix (`SECRET_SHOPIFY_TOKEN_PREFIXES`: `shpat_`, `shpss_`, `shpca_`, `shppa_`), because a private or Admin token must never be a `NEXT_PUBLIC_` variable. `ShopifyClient` sends every query and mutation with `@inContext(country: ES, language: ES)`. Catalog queries are cached by Next.js with `revalidate: 300` seconds (`CATALOG_REVALIDATE_SECONDS`), and cart calls use `cache: 'no-store'`.

Newsletter (`LocalNewsletterAdapter`) and contact (`LocalContactAdapter`) use local adapters under both providers. They only simulate delivery until a mail/CRM backend is connected, and `AppContainer.isMessagingSimulated()` returns `true`. The UI reads this only through `isMessagingEnabled()` (`presentation/config/messaging.ts`, `!isMessagingSimulated()`), and while it is false it hides the features that need that backend instead of showing a demo:
- the home `NewsletterSection` and the footer's "Recibe novedades" band;
- the `ContactForm` on `/contact`, which then ignores `?topic=` and shows the FAQ beside the quick help;
- the local checkout's marketing opt-in (`marketingOptIn` stays `false`) and its review line;
- the contact-form and newsletter purposes in the privacy policy.

`NewsletterForm` and `ContactForm` keep their validation and analytics but have no demo mode, since they are rendered only when messaging is enabled. They reappear automatically once `isMessagingSimulated()` returns `false`.

## Dependency container

`getContainer()` (`infrastructure/config/container.ts`) lazily builds a singleton `AppContainer` from environment variables (`readConfigFromEnv()` → `parseConfig()`) on first use, on server and client alike. There is no explicit init call. Adapter and use-case instances are cached per container, so every use case shares the same repositories. Tests call `createContainer(config)` / `resetContainer()`.

`AppContainer` API used by `app/` and `presentation/`:

| Method | Returns |
|---|---|
| `getProvider()` | `CommerceProvider` (`'local' \| 'shopify'`) |
| `getPricingPolicy()` | `PricingPolicy` (`storePricingPolicy`: currency, shipping rates, tax) |
| `getGetProductsUseCase()` | `execute(): Promise<Product[]>` |
| `getGetProductBySlugUseCase()` | `execute(slug): Promise<Product>` (throws `NotFoundError`) |
| `getManageCartUseCase()` | `getCart / addToCart / setQuantity / deleteFromCart (whole line) / clearCart`, all resolving to a `CartUpdate` (`dtos/Cart.ts`): `{ cart, notices }`, where `cart` is what the backend holds after the change and `notices` are `CartNotice`s for what it changed on its own (`quantityReduced` with `requested` and `quantity`, or `removed`; each with the line's `productId` and `productName`). Notices come from `CartRepository.loadNotices()` (lines a load dropped; `getCart` then saves once so they are removed and reported only once) and from comparing the requested cart with the one `CartRepository.save()` resolves to (`backendChanges`). `addToCart` re-reads the product so the current price and stock apply |
| `getCreateCheckoutUseCase()` | `execute(context?: CheckoutContext): Promise<CheckoutSession>` (`dtos/Checkout.ts`: `{ url, type: 'local' \| 'hosted' }`; `CheckoutContext` is `{ analyticsConsent: boolean \| null, attribution }`, default `DEFAULT_CHECKOUT_CONTEXT`). Throws `ValidationError` for an empty cart. `hosted` must be an absolute `https://` URL (required for Shopify) and `local` a single-slash in-app path; anything else throws |
| `getPlaceOrderUseCase()` | `execute(details: CheckoutDetails): Promise<OrderConfirmation>` (`dtos/Order.ts`). Throws `FormValidationError` for invalid fields and `ValidationError` for an empty cart; clears the cart on success |
| `getSubscribeNewsletterUseCase()` | `execute(email): Promise<void>` (throws `FormValidationError`) |
| `getSendContactMessageUseCase()` | `execute(message: ContactMessage): Promise<void>` (throws `FormValidationError`) |
| `isMessagingSimulated()` | `true` while newsletter and contact use the simulated local adapters. Read it in the UI only via `isMessagingEnabled()` |
| `getAnalyticsService()` | `AnalyticsService` (`PostHogAnalyticsAdapter` when `NEXT_PUBLIC_POSTHOG_KEY` is set, otherwise `NoopAnalyticsAdapter`) |
| `analyticsSuperProperties()` | `{ app_env, commerce_provider, app_release? }`, sent with every browser and webhook event |
| `getConsentRepository()` | `ConsentRepository` (`LocalStorageConsentRepository`, key `bugout.consent`) |
| `getOrderConfirmationStore()` | `OrderConfirmationStore` port (`save / load / clear`, never throws): `SessionStorageOrderConfirmationStore`, key `bugout.lastOrder`. It strictly validates stored data and returns `null` for anything invalid |
| `getSyncedStorageKeys()` | `{ cart: ['bugout.cart', 'bugout.shopify-cart-id', 'bugout.shopify-cart-rev'], consent: 'bugout.consent' }`, the only keys whose `storage` events other tabs react to. The constants are exported from their adapters |

Pure helpers:
- `application/catalog/`: `applyFilterCriteria(products, criteria)`, `summarizeCategories(products)` and `priceBounds(products)`. Sort options are `featured | price-asc | price-desc | rating | reviews`. Prices use every variant: a product matches a price range when any variant price is in it, `priceBounds` spans the cheapest to the dearest variant, and the price sorts use the cheapest (the "Desde" price).
- `application/catalog/variants.ts`: `isPeopleOption(option)` (the "Personas" option, matched without case or accents), `peopleOption(variant)`, `peopleCount(value | variant)` (the leading positive integer, so `"2"` and `"2 personas"` both give 2; null otherwise) and `variantOptionLabel(variant)` (the people count, else the first option value, else the title; for lists such as "1, 2 o 4").
- `application/catalog/kits.ts`: `kitsIn`, `looseProductsIn`, `comparableKits` (kits that are not build-your-own), `kitsContaining(slug, products)` and `includedInIndex(products)` (the "Incluido en el Kit X" badges, always derived from kit contents, never stored), `resolveContents(kit, products)`, `relatedProducts(product, products)`, `compareKits(kits)` (typed rows for the comparison table: starting price, variant options as `variantOptionLabel`, every spec label, item count) and `findByVariantId(products, id)` (used by `JsonProductAdapter` and `LocalStorageCartAdapter`). "Included in" leaves out build-your-own kits, whose linked lines are base backpacks to choose from.
- `application/catalog/kitBuilder.ts`: the Kit Custom builder's data. `builderBases(kit, products)` (the products its content lines link to), `builderGroups(kit, products)` (the other loose products by category), `builderPresets(kit, products)` (each comparable kit as a selection, with the lines it cannot add) and `builderTotal(lines, currency)`.
- `application/checkout/`: `validateCheckoutDetails(details, 'contact' | 'shipping' | 'all')`, `isValidSpanishPhone`, `isShippablePostalCode`, `NON_SHIPPABLE_POSTAL_PREFIXES`, `SHIPPING_COUNTRY` (`'ES'`), and `SHIPPABLE_PROVINCES` / `provinceForPostalCode(code)` (`provinces.ts`).

`FormValidationError` (`application/errors.ts`) carries `fieldErrors: Record<string, ValidationCode>`, keyed by field path (e.g. `customer.email`). `ValidationCode` is `'required' | 'invalidEmail' | 'invalidPhone' | 'invalidPostalCode' | 'unsupportedRegion' | 'postalCodeMismatch' | 'tooShort' | 'tooLong'`. The UI maps codes to copy (`presentation/components/forms/validationMessages.ts`).

## Domain rules

- `Money` is integer minor units plus an ISO currency. Never do arithmetic on `amount` (major units, for display and analytics); use `add`, `subtract`, `multiply` and so on. `discountPercentage(price, original)` (same file) is the one discount calculation, used by `Product.discountPercentage()` and `PriceTag`. `SHIPPING_METHOD_IDS` / `isShippingMethodId()` (`OrderPricing.ts`) list the valid shipping-method ids.
- `Cart` (`addItem`, `setQuantity`, `deleteItem`, `clear`) holds at most `MAX_QUANTITY_PER_ITEM` (99) per product and rejects out-of-stock products and mixed currencies. Violations throw `BusinessRuleError` with a `code` (`MAX_QUANTITY_EXCEEDED`, `OUT_OF_STOCK`, `CURRENCY_MISMATCH`).
- `Product.slug` is the URL handle. `Product.id` is the backend id of the **selected variant** (a Shopify variant GID when Shopify is active); `price`, `originalPrice` and `inStock` describe that variant too. Product JSON-LD (`productJsonLd`) omits `image` when there are no images and `sku` for Shopify GIDs. A multi-variant product is a `ProductGroup` (`variesBy` size, the number of people) with one `Product` and `Offer` per variant; every `Offer` carries `shippingDetails` (each rate of the pricing policy, priced for the product alone, to the shippable provinces' postal-code prefixes) and the returns policy (`merchantReturnPolicy()`).
- `Product.seo` (`ProductSeo`: optional `title` and `description`, or null) is the search title and description. It comes from `seo` in `products.json` or Shopify's search engine listing (`seo { title description }`); pages fall back to `name` and `description`.
- **Variants:** `Product.variants` lists every `ProductVariant` (`id`, `title`, `options`, `price`, `originalPrice`, `inStock`); a plain product has one implicit variant. `Product.fromVariants(base, variants, selectedId?)` selects the given variant or the first in stock, and `withVariant(id)` switches. `variantTitle` (e.g. "2 personas", null without options) and `displayName` ("Kit 72h · 2 personas") name cart and order lines. Shopify titles variants with the bare option value ("2"), so `mapVariant` (`adapters/shopify/productMapping.ts`) turns a bare positive integer in a "Personas" option into "1 persona" / "N personas" (joined with any other option values by " / ", as Shopify does) and keeps every other title; `hasVariants()`, `priceRange()` and `hasPriceRange()` drive the variant chips and "Desde" prices. Cart lines are keyed by the variant id, so two sizes of a kit are two lines, and `findById` in every product adapter resolves a variant id to its product with that variant selected (`findByVariantId` for the JSON catalog, a GraphQL `node` lookup for Shopify).
- **Shopify metafields** (`PRODUCT_FIELDS_FRAGMENT`): `custom.badge`, `custom.features`, `custom.specifications`, `custom.contents`, `custom.kit`, `custom.related`, `custom.long_description` (→ `details.longDescription`), `custom.position` (catalog order only, not stored on `Product`) and `reviews.rating` / `reviews.rating_count`. In `custom.specifications` and `custom.contents`, `value` and `quantity` may be strings or numbers. Setup: [SHOPIFY_SETUP.md](SHOPIFY_SETUP.md).
- **Kits:** a product is a kit when `details.kit` is set (`KitInfo`: `label` such as "72H", optional `idealFor`, `buildYourOwn` and `actionCards`, the printed deck of action cards it includes: `essential` or `complete`). Kit contents (`details.contents`) may reference catalog products with `productSlug`; `details.related` lists cross-sell slugs. The kits' category is `kits`; loose products use Spanish category slugs that equal `slugifyCategory()` of the Shopify product type (`agua`, `luz-y-energia`, `primeros-auxilios`, `refugio-y-abrigo`, `herramientas`, `higiene`), with labels in `messages.catalog.categories`.
- `rating` is `null` when there is no review data, which is true of every product in the demo catalog. `RatingStars`, the JSON-LD `aggregateRating` and the rating and reviews sort options appear only when a product has reviews (`hasReviews()`), for example from Shopify `reviews.*` metafields.
- Shipping and tax come only from `PricingPolicy` (`calculateOrderTotals`, `shippingCost`, `freeShippingThreshold` in `domain/entities/order/OrderPricing.ts`). The store policy (`infrastructure/config/pricingPolicy.ts`) has three rates and 21 % IVA included:
  - standard 4,95 €, free from 75 €
  - express 9,95 €
  - overnight 14,95 €

  Never hardcode thresholds in UI copy.
- Shipping region: Spain only, meaning the peninsula and the Balearics. Postal codes starting with a prefix in `NON_SHIPPABLE_POSTAL_PREFIXES` (`35`, `38`, `51`, `52`: Las Palmas, Santa Cruz de Tenerife, Ceuta, Melilla) fail validation with `unsupportedRegion`, because prices include IVA. Postal-code checks run in the order `required` → `invalidPostalCode` → `unsupportedRegion` → `postalCodeMismatch`; the last means the code belongs to a different province than the one selected.

## Presentation conventions

- **Copy:** short UI copy lives in `presentation/i18n/messages/<area>.ts` (Spanish), and components read `messages.<area>.<key>`. Long-form prose lives in the page components: the legal and shipping pages (`app/{privacy,cookies,terms,shipping-returns}/page.tsx`, rendered with `LegalPage` / `Prose`) and `app/about/page.tsx`. Use `ContactChannel` (`presentation/components/content/`) whenever copy tells customers how to reach the shop: it shows the email when configured, otherwise the contact form when messaging is enabled, and otherwise a neutral link to the contact page ("visita nuestra página de contacto"). `canPromiseReply()` (an email is configured or messaging is enabled) gates every reply promise and invitation to write, including the about page's "Contactar" button and the "write to us" FAQ answers. Shipping-method names come only from `messages.common.shippingMethods`. Format prices with `formatMoney` and map errors with `toUserMessage`.
- **Routes:** build links with `presentation/routes.ts` (`routes`, `catalogUrl`). Don't link to pages that don't exist.
- **SEO** (`presentation/seo/`):
  - Every indexable page builds its metadata with `pageMetadata({ title, description, path, images?, absoluteTitle?, noindex? })`: title, description, canonical URL, and Open Graph and Twitter tags of its own. Next.js would otherwise reuse the layout's share tags (the home page's) on a page that sets only a title, and drop them on a page that sets any `openGraph`.
  - Pages without their own image share `/share-image` (`app/share-image/route.tsx`, static). Products without photos (the kits, for now) share `/products/<slug>/share-image`, a card with the kit label, search title, short description and starting price, regenerated like the page. Both are drawn by `renderShareImage` with `next/og`: the colours in `shareImageColors` mirror the theme tokens (`shareImage.test.ts`), and Montserrat is read from the WOFF files in `app/fonts/` (`next/og` cannot read WOFF2).
  - Structured data is rendered with `<JsonLd data={…} />` from `structuredData.ts`: `OnlineStore` and `WebSite` on the home page, `BreadcrumbList` on product and category pages (from the visible breadcrumbs), `FAQPage` on `/faq` (the visible answers as text; `contactFaqEntries(policy)` for the order questions), and the product data above. Every fact comes from the catalog, the pricing policy or `siteConfig`.
  - Category pages take their title (also the heading), meta description and intro from `messages.catalog.categoryPages`.
- **Visual design:** the UI follows the partner design in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md): Montserrat, a sand page with white cards, navy heroes and orange pill buttons.
- **Colors:** use theme tokens from `globals.css` (`bg-navy`, `bg-navy-deep`, `bg-navy-darker`, `bg-sand`, `bg-sand-dim`, `bg-orange`, `text-accent`, …), not raw hex. `src/app/contrast.test.ts` checks every text/background pair against WCAG AA.
  - Orange buttons are `bg-orange` with `text-navy-deep` (white on orange fails AA).
  - Orange-family text on light backgrounds uses `text-accent`; on navy, `text-orange-on-navy`.
- **Components:** reuse the primitives in `presentation/components/ui`: Button, ButtonLink, IconButton, Container, PageHeader (`tone="hero" | "plain"`), Breadcrumbs, Eyebrow, SectionHeading, Reveal, FrogMascot, Drawer (`tone="dark"` for the mobile menu), TextField, TextAreaField, SelectField, CheckboxField, RadioGroupField, PriceTag, RatingStars, ProductBadge, Spinner, VisuallyHidden, `textLinkClasses` and icons. Feature components live in `presentation/components/<feature>/` (kit components in `kits/`).
- **State:** three providers are mounted once in `app/Providers.tsx`:
  - `CartProvider` (`useCart`):
    - `addItem(...)` resolves `Promise<boolean>` and shows no success toast; the opening drawer is the confirmation.
    - `addItems(lines, source?)` (the kit builder) goes through `ManageCartUseCase.addManyToCart`: every product is looked up in parallel, added on its own (a failing line is listed in `CartBulkUpdate.failures` instead of failing the rest) and saved once, so Shopify gets a single `cartLinesAdd`. Nothing is saved when no line could be added.
    - Every cart operation shows the cart the use case returns and turns its `CartNotice`s into info toasts (`messages.cart.quantityReduced`, `messages.cart.lineRemoved`). When the store kept none of the units added, `addItem` resolves false, leaves the drawer closed and tracks `add_to_cart_failed` (`out_of_stock`); otherwise `product_added_to_cart.quantity` (and the drawer's quantity-change events) count only the units the store kept.
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
  - The home page, product pages, `/how-to-choose`, `/why-prepare`, the action card pages (`/why-prepare/[slug]`, prerendered from `presentation/prepare/cards.ts`; a card code such as `/why-prepare/pa-04` redirects to its page), `/faq` and `sitemap.ts` export `revalidate = 300`.
  - The root layout loads the catalog once and passes `navData(products)` (the kits, their category, the loose products' categories and the flagship kit, the one with the most contents) to the header, mobile menu and footer. The header shows Kits, Productos and Prepárate (`primarySections`), with the kits, the categories and the Prepárate links (`prepareLinks()`, built on the server so the card deck stays out of client bundles) in hover dropdowns (`PrimaryNav`). The home hero puts the flagship kit's button first (`heroKits`).
  - `/products/[slug]` renders kits with `KitGallery`, `PurchasePanel` (variant chips, price, stock, quantity, spec table) and the contents list; loose products share the frame and link the kits that include them.
  - `/products` parses filters with `parseCatalogSearchParams(input, { categories })`. Unknown categories are ignored, and the page is `noindex` for them. The catalog view syncs filters back to the URL with `window.history.replaceState` (no navigation).
  - The order confirmation view sets the tab title.
  - `CopyrightNotice` is a small client component that updates the year after hydration.
  - `siteConfig.url` resolves to `NEXT_PUBLIC_SITE_URL`, then `https://$VERCEL_PROJECT_PRODUCTION_URL`, then `http://localhost:3000` (a bare host gets `https://`), and warns in production builds when it falls back. It is only correct on the server.
- **Accessibility:**
  - Every control has an accessible name.
  - Dialogs trap focus, close on Escape and restore focus.
  - Form fields have associated labels, with error text linked via `aria-describedby`.
  - One `<h1>` per page. A Suspense fallback that shows a page header uses `PageHeader`'s `placeholder`, so the server HTML never holds a second `<h1>`.
  - Motion respects `prefers-reduced-motion`.
- **Honesty:** no fabricated ratings, reviews, stock or marketing figures, and no success messages for actions that did nothing.

## Analytics

The full picture (storefront, Shopify checkout pixel, order webhooks, dashboards, Google Ads preparation) is in [ANALYTICS.md](ANALYTICS.md).

Events are typed in `application/analytics/events.ts` (product events carry `variant_title`; `product_added_to_cart.source` is `product_page`, `product_card`, `cart_drawer` or `kit_builder`; `kit_builder_added_to_cart` summarises a builder add) and sent only through `AnalyticsService` (`track`, `captureException`, `setConsent(granted, origin)`, `checkoutAttribution()`). There is no `identify`: events never carry personal data. Checkout containers that show customer data have the `ph-no-capture` class, so autocapture skips them.

`PostHogAnalyticsAdapter` does nothing on the server and sends nothing until consent is granted. Calls made before the visitor's first decision are held in memory (at most 50) and replayed with their original `timestamp` if they accept, or discarded if they reject. `checkoutAttribution()` returns the PostHog distinct and session ids plus the landing URL's campaign parameters (`campaignParametersFrom`, `application/analytics/attribution.ts`: UTM tags, `gclid`, `gbraid`, `wbraid`), or `EMPTY_ATTRIBUTION` without consent; `CartContext.checkout` passes it, with the stored consent decision, to `CreateCheckoutUseCase`. `ConsentOrigin` distinguishes the two ways that happens:
- `'visitor'`: the visitor clicks Accept, and exactly one `$opt_in` event is sent;
- `'restored'`: a stored decision is re-applied on page load or synced from another tab, and the SDK opts in silently, with no `$opt_in` per page load. After consent, the adapter:
- imports `posthog-js` on demand and initialises it with `opt_out_persistence_by_default`, `disable_session_recording`, `advanced_disable_flags`, `disable_surveys`, autocapture limited to clicks on `a`, `button`, `summary` and `[role="button"]`, and heatmaps, dead clicks and performance capture off (the project has a 0 € billing limit);
- registers the container's `analyticsSuperProperties()`;
- sends `checkout_started` with `send_instantly` and `sendBeacon`, because the page navigates to the hosted checkout right after;
- queues up to 100 calls while the SDK loads and replays them after init;
- never throws into callers.

Withdrawing consent:
1. clears the queue;
2. calls `reset()` and then `opt_out_capturing()`, in that order, because `reset()` also clears the stored opt-out;
3. removes every leftover `ph_*` / `__ph_opt_in_out_*` storage entry, except `__ph_opt_in_out_<key>` = `"0"`, which keeps later inits opted out;
4. expires PostHog cookies for the host and each parent domain (`cookieDomainsFor`, e.g. `www.bugout.es` → `bugout.es`), because the SDK writes cross-subdomain cookies.

Before consent nothing is sent and no analytics cookies are written. The consent decision is versioned (`CONSENT_VERSION`); stored decisions from another version count as undecided. `PostHogAnalyticsAdapter.sdk.test.ts` checks this against the real SDK, and `PostHogAnalyticsAdapter.cookies.test.ts` covers the cookie domains.

PostHog is proxied through `/ingest` to the EU region (see `next.config.ts`). A custom absolute `NEXT_PUBLIC_POSTHOG_HOST` is also supported. `next.config.ts` exports `contentSecurityPolicy(env)` and `posthogOrigins(host)`. The production CSP allows same-origin scripts and connections, the Shopify store domain in `connect-src`, and an absolute PostHog host in `script-src` and `connect-src` (plus the matching `-assets` host for `*.i.posthog.com`). Third-party toolbars (Vercel, PostHog) don't load in production. Env: `NEXT_PUBLIC_POSTHOG_KEY`, optional `NEXT_PUBLIC_POSTHOG_HOST` (default `/ingest`).

Shopify orders are tracked server-side: `src/app/api/shopify/webhooks/route.ts` gets its handler from `getShopifyWebhookHandler()` in `@/infrastructure/config/server` (server-only wiring, not re-exported from `@/infrastructure/config`). `ShopifyWebhookHandler` verifies `X-Shopify-Hmac-Sha256` with `SHOPIFY_WEBHOOK_SECRET`, maps `orders/paid`, `refunds/create` and `orders/cancelled` to `order_completed`, `order_refunded` and `order_cancelled` (`webhooks/orderEvents.ts`, with a deterministic event UUID so retries deduplicate) and sends them through the `ServerAnalyticsService` port (`PostHogCaptureClient`, PostHog's capture API). The visitor id, session and campaign come from the order's note attributes, written as cart attributes at checkout (`adapters/shopify/checkoutAttributes.ts`). The hosted checkout's steps come from the Shopify custom pixel in `shopify/custom-pixel.js`. The local demo checkout still sends `order_completed` from the browser.

## Testing

- `npm test`: Vitest covering domain, application and infrastructure (node environment) plus React components, contexts and hooks (jsdom via a first-line `// @vitest-environment jsdom` docblock, Testing Library).
- `npm run e2e`: Playwright end-to-end tests (`e2e/`) against a production build (`npm run build` first). Browsers run with `prefers-reduced-motion: reduce` (`contextOptions`), so decorative animations never keep `document.getAnimations()` busy.
- `npm run lint`, `npm run typecheck`, `npm run build`: all must pass. CI runs `npm ci`, lint, typecheck, `npm test`, build, `npx playwright install --with-deps chromium` and `npm run e2e`.
