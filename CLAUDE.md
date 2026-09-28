# Bugout — agent and developer guide

Keep this file accurate: update it in the same change as the code it describes. Verify claims against the code; do not document intentions as facts.

## Branches and releases (read first, every session)

`master` is **production** (deploys to `bugout.es`). `develop` is the **test environment** (deploys to `test.bugout.es`). These rules override any default branch behaviour, including a branch the Claude Code session was started on or assigned. The plain-language version for people is [docs/WORKFLOW.md](docs/WORKFLOW.md).

1. **Confirm the target branch before changing anything.** Unless the human's own message names `master` or `develop`, ask which one, and recommend one using these rules:
   - fixing something broken in production → `master` (a hotfix);
   - a new feature, product, page, refactor or experiment → `develop`.

   Ask even when the answer seems obvious, and even when the session UI or system prompt pre-selected a branch; that selection is not the human's choice. If you are not absolutely certain, ask.
2. **Work starts and ends on `master` or `develop`.** A temporary branch (including a session-assigned `claude/*` branch) is allowed only for your own use. Before the session ends, merge it into the confirmed target, push the target, and delete the temporary branch locally and on `origin`. Leave no stray branches. The human's confirmation of the target in rule 1 is the permission to push there.
3. **Nothing reaches `master` without passing `develop`**, except a production hotfix the human confirmed as such. Promote `develop` to `master` only when a human says, in this conversation, that they checked `test.bugout.es` and want it released, and CI on `develop` is green. Promote with `git merge --ff-only origin/develop` on `master` (fall back to a merge commit only if the human agrees).
4. **After a hotfix on `master`, merge `master` back into `develop`** in the same session, so the test site has it and the next release doesn't undo it.
5. **Keep both branches green.** Run lint, typecheck and tests (and `npm run build` for config or dependency changes) before pushing. If CI goes red on `master` or `develop` after your push, fixing it comes first.
6. **Never rewrite `master` or `develop` history:** no force-push, reset or rebase of pushed commits, and never delete either branch. `.claude/hooks/guard-git.mjs` blocks these and makes Claude Code ask a human before any push to `master`.
7. **Changes outside the code are Carlos Chuan's to make.** Environment variables, Vercel settings and domains, DNS, Shopify admin, PostHog, GitHub settings and secrets are never changed from a session. When a change needs one, end your reply with a **"Needs Carlos"** list: what to change, where, the exact value, and why.

`.claude/settings.json` wires the hooks: `session-start.mjs` reminds each session of these rules and the current branch; `guard-git.mjs` guards pushes. Keep these rules, docs/WORKFLOW.md and the hooks in sync.

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

The kit card photos and their depth are built offline, only when a photo or its settings change: `pip install -r scripts/kit-cards/requirements.txt`, then `python3 scripts/kit-cards/build.py`.

## Architecture

Clean Architecture. Dependencies point inward only. For details, container API and provider matrix, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```
src/app/            Next.js routes only: load data via the container, render presentation components
src/presentation/   components/<feature>/ (home, kits, catalog, cart, checkout, layout, ...), components/ui/ (design system), context/, hooks/, i18n/, routes.ts, config/ (site, brand, messaging, mascot)
src/application/    use-cases/, ports/ (interfaces), dtos/, catalog/ (filters, kits.ts) + checkout/ (pure helpers), analytics/events.ts, errors.ts
src/domain/         entities (Product, Cart, CartItem, OrderPricing), value-objects (Money, ProductId, Quantity), errors
src/infrastructure/ adapters/ (json, localStorage, shopify incl. webhooks/, analytics, local simulated services), config/ (AppContainer, env, pricing; server.ts for route handlers), data/
src/app/api/        route handlers (Shopify order webhooks)
shopify/            code pasted into Shopify admin (custom-pixel.js)
scripts/posthog/    PostHog project settings and dashboards (setup.mjs)
scripts/kit-cards/  builds the kit card photos and their depth relief (build.py, Python; see "Design system")
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
- **SEO:** build every indexable page's metadata with `pageMetadata()` from `presentation/seo/pageMetadata.ts` (title, description, canonical path, share images); never set `openGraph` or `alternates` by hand. See docs/ARCHITECTURE.md ("SEO").
  - Share images: `/share-image` (the default) and `/products/<slug>/share-image` (products without photos), both drawn by `renderShareImage` in `presentation/seo/shareImage.tsx`. Its `shareImageColors` must match the theme tokens (`shareImage.test.ts`).
  - Structured data goes through `<JsonLd>` and the builders in `presentation/seo/structuredData.ts` (`organizationJsonLd`, `websiteJsonLd`, `breadcrumbJsonLd`, `faqPageJsonLd`, `merchantReturnPolicy`, `shippingDetails`) plus `productJsonLd`. Its facts come from the catalog, the pricing policy or `siteConfig`, like the visible copy, and it only describes what the page shows.
  - Search titles and descriptions: `Product.seo` (from `seo` in `products.json` or Shopify's search engine listing) for products, `messages.catalog.categoryPages` for categories (title, which is also the heading, description and intro), `metaTitle` in `messages.content` for the content pages.
  - The home page's `<h1>` is the small line above the slogan (`messages.catalog.home.heroHeading`); the slogan is a paragraph. The hero's primary button is the flagship kit (`heroKits`).
- **Links:** build URLs from `src/presentation/routes.ts`, using `routes.*` (including `howToChoose`, `whyPrepare`, `faq`) and `catalogUrl({ category, sort, priceMin, priceMax, inStock, onSale })`. Do not hardcode paths or link to pages that do not exist. Kits live at `routes.product(slug)` like any product.
- **Design system:** follow [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md). In short:
  - Montserrat (self-hosted variable font in `src/app/fonts/` via `next/font/local`, variable on `<html>`; the two WOFF files there are only for the share images); a sand page (`bg-sand`) with white cards (`rounded-2xl bg-white shadow-card`); navy heroes, header and footer; container `max-w-site` (via `Container`).
  - Pages open with `PageHeader` (default `tone="hero"`, a full-width navy banner rendered outside any `Container`; `tone="plain"` for checkout; `placeholder` for a Suspense fallback, which renders the title as a paragraph so the HTML never has two `<h1>`). Sections open with `SectionHeading` / `Eyebrow`.
  - The header is `fixed`: transparent over the home hero until scrolled, solid elsewhere. `main` is offset by `--header-height`; the home hero slides under the header. Its nav links show from `xl` (1280px); below that the menu button (`MobileMenu`) takes over, because the links, logo, cart and "Compra ahora" do not fit one row.
  - `NavLinkList` takes `idleClassName` and `currentClassName` for state-dependent utilities (like the text colour), so a link never carries both.
  - Brand art and the frog are in `public/images/brand|mascot/` (paths via `brandAssets` in `presentation/config/brand.ts`). Product photos are `public/images/products/<slug>.jpg`, shot on navy.
  - Motion (`Reveal`, `FrogMascot`, `KitPhotoSwing`, hover lifts) is decorative and stops under `prefers-reduced-motion`.
  - The Kit 24h and Kit 72h cards show the backpack each kit comes in instead of the gradient header, wherever `KitCard` is used (home, `/how-to-choose`): a cut-out photo (`public/images/kit-cards/<slug>.webp`) on white that sticks out above the card and swings slowly, ±12° round its vertical axis every 12 s. `kitCardPhoto(slug)` in `kits/kitCardPhotos.ts` picks the photo and how tall it is drawn: in `cqw` of the card (a size container), so it never grows wider than the card, up to `maxHeight`, with the Kit 72h's 65 L backpack about 1.3 times as tall as the Kit 24h's 30 L one. The Kit Custom keeps the gradient.
    - `KitPhotoSwing` shows the still photo first and, near the viewport, swings the same photo with WebGL (`photoReliefRenderer.ts`, no library): a grid over the photo pushed toward or away from the camera by a depth relief (`photoRelief.ts`), so it turns with volume while staying the real photo; at 0° it matches the still photo. It pauses off screen and keeps the still photo under reduced motion, without WebGL or if the photo fails to load.
    - `scripts/kit-cards/build.py` cuts out the photos (from `scripts/kit-cards/photos/<slug>/`) and works out the relief from an approximate shape of each bag body; it writes the photos and `kits/kitCardPhotos.generated.ts`. Never edit those by hand; rerun the script.
    - Photo cards do not clip (`overflow-hidden` only on gradient cards). `KitCardGrid` (a size container) leaves the room the photos rise into, computed in CSS from the card width (`kitPhotoVars`): above each photo card when the cards stack, above the row in columns, so a photo never covers the heading above or the card above.
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
  - Cart lines are keyed by variant id; every `ProductRepository.findById` resolves a variant id to its product with that variant selected. `JsonProductAdapter` (and `LocalStorageCartAdapter`) do it with `findByVariantId` in `application/catalog/kits.ts`; `ShopifyProductAdapter` does a GraphQL `node` lookup of the variant GID.
  - To read the number of people of a variant or option value, use `peopleCount(value | variant)` and, for compact lists ("1, 2 o 4"), `variantOptionLabel(variant)` from `application/catalog/variants.ts`. They accept both `"2"` and `"2 personas"`; never read `options[0].value` as the count.
  - A product is a kit when `details.kit` (`KitInfo`: `label`, optional `idealFor`, `buildYourOwn`) is set. `details.contents[].productSlug` links a kit line to a catalog product; `details.related` lists cross-sell slugs. `parseCatalog` rejects references to unknown slugs.
  - Use the helpers in `application/catalog/kits.ts` (`kitsIn`, `looseProductsIn`, `comparableKits`, `kitsContaining`, `includedInIndex`, `resolveContents`, `relatedProducts`, `compareKits`); never store "included in" data.
  - **Build-your-own kit (Kit Custom):** `Product.isBuildYourOwn()` (`details.kit.buildYourOwn`). It is never sold as such: its cards have no quick add and no "Agotado" overlay, its page has no `PurchasePanel` (price as "Desde", a "Montar mi kit" link to `#kit-builder`, its specs) and its JSON-LD has no `offers`. Its linked content lines are the **base backpacks to choose from**, not what it includes, so `kitsContaining`/`includedInIndex` (via `comparableKits`), the home showcase (`pickFlagship`) and the "Compra ahora" pick (`navData`, unless it is the only kit) leave it out.
  - Its page renders `KitBuilder` (`presentation/components/kits/`), fed by `application/catalog/kitBuilder.ts`: `builderBases` (step 1, plus "Ya tengo mochila"), `builderGroups` (every other loose product by category), `builderPresets` ("Partir del Kit 24h/72h": a ready-made kit's linked, in-stock contents, listing what it cannot add) and `builderTotal`. "Añadir al carrito" calls `addItems`; after a successful add the builder resets to "Ya tengo mochila" and no products.
  - Category slugs are the slugified Spanish Shopify product types: `kits`, `agua`, `comida`, `luz-y-energia`, `primeros-auxilios`, `refugio-y-abrigo`, `herramientas`, `higiene` (labels in `messages.catalog.categories`).
  - Shopify: variants come from `variants(first: 20)` with `selectedOptions` (option `Personas`; `mapVariant` titles a bare value `2` as "2 personas"), and kits from the `custom.kit` (JSON), `custom.related` (list of handles) and `custom.contents` (`handle` per line) metafields. `custom.long_description` fills `details.longDescription`, and `ShopifyProductAdapter.findAll` sorts by `custom.position` (lowest first, unset last); the local catalog keeps `products.json` order. Products priced in a currency other than `storePricingPolicy.currency` are skipped with a warning. See docs/SHOPIFY_SETUP.md.
  - Catalog price filters, `priceBounds` and price sorts use every variant (`priceRange()`): a product matches when any variant price is in range, and sorts use the cheapest.
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
  - `addItems(lines, source?)` (default source `kit_builder`) adds several lines through `ManageCartUseCase.addManyToCart` in **one save**. It never rejects: it resolves `{ addedLines, addedUnits, failedLines, cart }`, opens the drawer once when anything was added, and shows one error toast per line that could not be added (`CartBulkUpdate.failures`) while adding the rest.
  - Buttons that call `addItem` or `addItems` (`AddToCart`, `QuickAddButton`, `KitBuilder`) use `Button`'s `focusableWhileLoading` (aria-disabled, clicks ignored) instead of `disabled` while loading, so the drawer, which opens mid-add, can return focus to them.
  - `ManageCartUseCase` methods resolve to a `CartUpdate` (`application/dtos/Cart.ts`): `{ cart, notices }`, with the cart the backend really holds (`CartRepository.save` resolves to it; Shopify lowers quantities to the stock and drops sold-out lines) and `CartNotice`s (`quantityReduced`, `removed`) for what it changed on its own. `CartContext` shows each notice as an info toast (`messages.cart.quantityReduced` / `lineRemoved`); when none of the units could be added, `addItem` resolves false without opening the drawer.
  - `checkout({ replace?: boolean })` resolves `Promise<boolean>`, true once navigation has started. `/checkout` hands off to Shopify with `replace: true` (`location.replace`) and recovers when the page is restored from the back/forward cache.
  - `loadError` is true when restoring the cart failed; `refresh()` retries.
  - Any other operation that must not interleave with cart mutations goes through `runExclusive(task)`. For example, the local checkout places its order this way.
  - Cross-tab sync listens only to `getContainer().getSyncedStorageKeys()`: `cart` = `bugout.cart`, `bugout.shopify-cart-id` and `bugout.shopify-cart-rev`; `consent` = `bugout.consent`. The key constants are exported from their adapters. Never hardcode storage keys.
  - The last order confirmation goes through `getContainer().getOrderConfirmationStore()` (sessionStorage `bugout.lastOrder`, strictly validated on load).
- **Analytics:** track only events defined in the typed catalogue `src/application/analytics/events.ts`, through the `AnalyticsService` from `useAnalytics()`. Do not import `posthog-js` anywhere else. Add a new event to the catalogue first. The whole setup (pixel, webhooks, dashboards, Google Ads) is in [docs/ANALYTICS.md](docs/ANALYTICS.md); keep it in sync.
  - The PostHog project has a 0 € billing limit (free tier only), so add an event only when it answers a question the dashboards need, prefer autocapture for plain clicks, and keep heatmaps, web vitals, recordings and form autocapture off.
  - `AnalyticsService` has only `track`, `captureException`, `setConsent(granted, origin)` and `checkoutAttribution()`; there is no `identify`.
  - Events tracked before the visitor's first consent decision are held in memory (max 50) and sent with their original time only if they accept.
  - Every browser and webhook event carries `app_env`, `commerce_provider` and `app_release` (`getContainer().analyticsSuperProperties()`; `NEXT_PUBLIC_APP_ENV`/`NEXT_PUBLIC_APP_RELEASE` are set in `next.config.ts` from `VERCEL_ENV`/`VERCEL_GIT_COMMIT_SHA`).
  - At the Shopify hand-off, `CartContext.checkout` passes `{ analyticsConsent, attribution: analytics.checkoutAttribution() }` to `CreateCheckoutUseCase`. `ShopifyCheckoutAdapter` writes the attribution as hidden cart attributes (`_ph_distinct_id`, `_ph_session_id`, `_utm_*`, `_gclid`, `_gbraid`, `_wbraid`; keys in `adapters/shopify/checkoutAttributes.ts`, mirrored in `shopify/custom-pixel.js`) and requests the checkout URL with `@inContext(visitorConsent: …)` once the visitor decided. Without consent the attribution is empty and earlier attributes are cleared.
  - Shopify orders are tracked server-side by `src/app/api/shopify/webhooks/route.ts` (`orders/paid` → `order_completed`, `refunds/create` → `order_refunded`, `orders/cancelled` → `order_cancelled`; `ServerAnalyticsEvent`), wired in `@/infrastructure/config/server` (server-only; never import it from client code). The hosted checkout's steps (`checkout_step_completed`, `checkout_alert_displayed`) come from `shopify/custom-pixel.js`, pasted into Shopify by Carlos.
  - Dashboards and PostHog project settings live in `scripts/posthog/setup.mjs` (idempotent; `--check` validates the queries). When you add or rename an event, update the affected insights there.
  - `origin` is a `ConsentOrigin`: `'visitor'` for a fresh Accept or Reject (a visitor Accept sends one `$opt_in`), or `'restored'` for a stored or other-tab decision (opts in silently).
  - Never send personal data (names, emails, phones, addresses, free text) in events.
  - Mark containers that show customer data with the `ph-no-capture` class.
  - Monetary properties are in major units with `currency`. Product events carry `product_id` (the variant id) and `variant_title`, and so do `add_to_cart_failed` and each `order_completed.products[]` entry (which also has `product_name`).
  - `product_added_to_cart.source` is `product_page`, `product_card`, `cart_drawer` or `kit_builder`. The builder also sends one `kit_builder_added_to_cart` (lines and units added, `base_slug`, `preset_slug`).
  - `product_variant_selected` is sent by `PurchasePanel` when the visitor picks another variant, never for the initial selection.
- **Consent:** analytics are gated on consent. `PostHogAnalyticsAdapter` sends nothing and loads nothing until `setConsent(true, origin)`: after the visitor accepts the banner, or when a stored grant is restored. Withdrawal resets and opts out, then deletes PostHog storage and cookies (host and parent domains, `cookieDomainsFor`), keeping only `__ph_opt_in_out_<key>="0"`.
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
  - No fabricated ratings, reviews, stock figures, statistics, guarantees or success messages. Trust-bar and FAQ facts come from the pricing policy, `siteConfig` or the catalog, and never promise a service the code does not provide (there is no expiry reminder: the trust bar's "Caducidad a la vista" only says water and food show their date on each pack). The partner prototype's unverified claims (5-year warranty, "24–48h" delivery, "+40.000 kits", "4,9/5") must not come back. The demo catalog has no ratings (`rating: null`), so the rating UI, JSON-LD `aggregateRating` and the rating and reviews sort options appear only when real review data exists (for example, Shopify `reviews.*` metafields).
  - Product JSON-LD omits `image` when a product has none and omits `sku` for Shopify GIDs. Kits sold in several sizes are a `ProductGroup` with one `Offer` per variant.
  - Structured data never claims what the page does not say: the returns policy and shipping rates come from `siteConfig.returnWindowDays` and the pricing policy, and there are no delivery-time fields because the policy has no separate handling and transit times.

## Environment variables

See `.env.example`. `NEXT_PUBLIC_*` values are inlined at build time; rebuild after changing them. The app runs locally with none set, but the LSSI variables below must be set before launch.

| Variable | Default | Read in | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_COMMERCE_PROVIDER` | `local` | `infrastructure/config/appConfig.ts` | `local` or `shopify`; any other value throws `ConfigurationError` |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | none | `appConfig.ts`, `next.config.ts` (CSP `connect-src`) | Required for `shopify`, e.g. `store.myshopify.com` |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` | none | `appConfig.ts` | Required for `shopify`; public Storefront API token. A value starting with a secret prefix (`shpat_`, `shpss_`, `shpca_`, `shppa_`) throws `ConfigurationError`: private and Admin tokens must never be `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SHOPIFY_API_VERSION` | `2026-07` (`DEFAULT_SHOPIFY_API_VERSION` in `adapters/shopify/ShopifyClient.ts`) | `appConfig.ts` | Storefront API version |
| `NEXT_PUBLIC_POSTHOG_KEY` | none (analytics off, `NoopAnalyticsAdapter`) | `appConfig.ts` | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `/ingest` (set in `PostHogAnalyticsAdapter`) | `appConfig.ts`, `next.config.ts` (CSP) | PostHog ingestion host. An absolute host is supported: `posthogOrigins()` adds it to CSP `script-src` and `connect-src`, plus the `-assets` host for `*.i.posthog.com` |
| `NEXT_PUBLIC_SITE_URL` | see next row | `presentation/config/site.ts` | Canonical origin (metadata, sitemap, robots, JSON-LD) |
| `VERCEL_PROJECT_PRODUCTION_URL` | set by Vercel | `site.ts` | Fallback origin `https://<value>`, then `http://localhost:3000`. A production build warns when neither is set. A bare host in `NEXT_PUBLIC_SITE_URL` gets `https://` added |
| `VERCEL_ENV` | set by Vercel; unset elsewhere | `site.ts` (`isIndexableDeployment` → `siteConfig.indexable`), `next.config.ts` (`robotsHeaders`) | Anything but `production` (the test site, previews) sends `X-Robots-Tag: noindex, nofollow` and a `robots.txt` that disallows everything. Unset (local, CI) is indexable |
| `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_APP_RELEASE` | set in `next.config.ts` from `VERCEL_ENV` and `VERCEL_GIT_COMMIT_SHA`; `local` / none elsewhere | `appConfig.ts` | `app_env` and `app_release` on every analytics event. Don't set them by hand |
| `SHOPIFY_WEBHOOK_SECRET` | none (the webhook route answers 503) | `infrastructure/config/server.ts` | Server-only, never `NEXT_PUBLIC_`. Signing key of the Shopify order webhooks (Settings → Notifications → Webhooks) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | hidden when unset | `site.ts` | **Required before launch (LSSI).** Support email on contact and legal pages, and via `ContactChannel` |
| `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID`, `NEXT_PUBLIC_LEGAL_ADDRESS` | hidden when unset | `site.ts` | **Required before launch (LSSI).** Seller identity on legal pages |
| `E2E_PORT` / `E2E_SKIP_SERVER` / `CI` | `3100` / unset | `playwright.config.ts` | E2E server port, reuse a running server, CI mode |

Reference each env var literally as `process.env.NEXT_PUBLIC_X`; Next.js inlines only literal references. The simulated-delay setting (`simulatedDelayMs`) comes only from `AppConfig`, not from env.

## Testing

- Unit tests sit next to the code as `*.test.ts(x)` (Vitest, globals on, `@/` alias).
- The default environment is `node`. React component, context and hook tests opt into jsdom with `// @vitest-environment jsdom` on the **first line**, and use Testing Library (`vitest.setup.ts` loads jest-dom and cleans up).
- `PostHogAnalyticsAdapter.sdk.test.ts` runs the real `posthog-js` SDK to check consent, opt-out and storage cleanup, and `PostHogAnalyticsAdapter.cookies.test.ts` covers cookie removal on parent domains. Keep both passing when you touch analytics. `customPixel.test.ts` runs `shopify/custom-pixel.js` in a sandbox and checks its attribute keys match the site's.
- Test helpers: `domain/testing/` (`buildProduct`, `testPricingPolicy`), `application/testing/` (fakes, checkout details), `infrastructure/testing/` (`MemoryStorage`, Shopify fixtures). `fast-check` is available for property tests.
- Add or update tests with every behaviour change.
- `src/app/contrast.test.ts` checks the theme's text/background pairs against WCAG AA.
- E2E: Playwright specs live in `e2e/` (smoke, navigation, catalog, kits, cart, purchase, forms, consent, a11y, seo) with shared helpers in `e2e/support/` (`site.ts` mirrors the catalog: `PRODUCTS`, `KITS`, `CATEGORY_COUNTS`, `variantName`).
  - They run against a production build, with `desktop` (Chrome 1440×900) and `mobile` (Pixel 7) projects, locale `es-ES` and `prefers-reduced-motion: reduce` (`contextOptions`).
  - Accessibility checks use `@axe-core/playwright`.
- CI (`.github/workflows/ci.yml`, Node 22) runs on pushes to `master` and `develop` and on PRs: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run e2e`. It uploads the Playwright report on failure.
- Deployment is Vercel's Git integration, not CI: `master` deploys to production (`bugout.es`), `develop` to the test site `test.bugout.es` (a Preview domain bound to that branch, not access-protected but kept out of search engines via `VERCEL_ENV`). See README "Deployment notes" and the branch rules at the top of this file.

## Known limitations / backend work pending

- Newsletter (`LocalNewsletterAdapter`) and contact (`LocalContactAdapter`) only simulate delivery after a short delay and send nothing. `isMessagingSimulated()` returns `true`, so `isMessagingEnabled()` is false and the newsletter, the contact form and the checkout marketing opt-in are hidden. No backend is connected yet. Connecting one means wiring real adapters in `AppContainer` and making `isMessagingSimulated()` return `false`; the UI then shows them again.
- With messaging hidden and no `NEXT_PUBLIC_CONTACT_EMAIL`, the site offers no way to reach the shop: `ContactChannel` links to `/contact`, which shows only the quick help and FAQ. Set the email before launch.
- The `local` checkout is a demo (`LocalOrderGateway`): no payment, no real order, nothing leaves the browser. The confirmation is kept in sessionStorage (`bugout.lastOrder`, via `OrderConfirmationStore`).
- Shopify purchases are tracked only once Carlos has registered the order webhooks, set `SHOPIFY_WEBHOOK_SECRET` and installed the custom pixel (docs/ANALYTICS.md). Refund events carry no visitor link (Shopify's refund payload has no cart attributes). Browser funnels and attribution cover only visitors who accept analytics; webhook revenue covers every order.
- Google Ads is prepared, not active: click ids and UTM tags reach `order_completed`, but sending conversions to Google needs an advertising consent category in the banner first (docs/ANALYTICS.md).
- `NEXT_PUBLIC_CONTACT_EMAIL` and the legal identity vars (`NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID`, `NEXT_PUBLIC_LEGAL_ADDRESS`) are required before launch (LSSI). Unset fields are simply hidden, so nothing fails loudly if they are missing. Until the contact backend exists, the email is the only real channel.
- Product photos: every loose product in the local catalog has its own photo (`public/images/products/<slug>.jpg`). The kits have none yet: their pages show a decorative navy box with the kit label plus their contents' photos. Kit cards (`KitCard`) cycle navy, orange and deep-navy gradient headers, except the Kit 24h's and Kit 72h's, which show a photo of their backpack (`kitCardPhoto`); product cards (`ProductCard`) show the kit label on a navy gradient. Shopify will supply the real images; `cdn.shopify.com` is allowed in `next.config.ts`.
- The demo catalog's prices, weights, dimensions and kit contents are the partner prototype's placeholders, not confirmed business data. Replace them (in Shopify or `products.json`) before selling. Known mismatches: the Kit 24h comes in a 30 L backpack (the one its card shows), yet its demo specs (25 × 18 × 12 cm, 1,8 kg) and contents have no backpack, and `mochila-65l.jpg` shows that same 30 L backpack.
- The Kit Custom builder has no guidance yet (for example "no has añadido ninguna fuente de luz" with light-source suggestions); a later version could use product tags for it. It offers each loose product in its selected (first in-stock) variant, with a version picker for multi-variant products; base backpacks use their default variant. Its "Desde" price is the Kit Custom product's own price, so keep that equal to the cheapest base backpack.
- The kit card photos swing ±12°; they never turn all the way round, because each card has one photo: past the swing there would be nothing to show. They are as big as the card width allows (about 1.5 times their first size on desktop); twice that would be wider than the card. The relief is approximate, so the edges of the bag smear a little at the ends of the swing, and the Kit 72h's photo is small (the bag is about 300 px tall), so it is upscaled and looks soft on high-density screens; a larger photo would fix that. A 3D model rebuilt from 1–3 photos of each backpack was tried and dropped because it looked blurry and boxy (see the history of `KitCard.tsx`). A real 360° turn needs 24–36 photos taken round each backpack (or a video of it turning) and a frame-sequence player.
- No expiry-reminder system exists, so the trust bar and FAQ no longer promise one ("te avisamos para renovar los consumibles" was removed). If the business adds reminders, build them first, then change the copy in `messages/catalog.ts` (`trustExpiry*`) and `messages/content.ts` (`faqPage.expiryAnswer`).
- The Shopify API version default `2026-07` must stay within Shopify's supported window. Bump `DEFAULT_SHOPIFY_API_VERSION` or set the env var before it expires.
- Shopify shipping zones and rates must be configured to match `storePricingPolicy`, including excluding Canarias, Ceuta and Melilla. The app quotes shipping and tax from that policy, while Shopify's hosted checkout charges its own.
  - The Shopify market for Spain must sell in EUR; a cart priced in another currency throws `ShopifyApiError`.
- Strike-through prices (`originalPrice`) must follow the EU/Spanish price-reduction rule: the reference price must be the lowest price of the previous 30 days. The code cannot check this; it is the business's responsibility when setting prices.
- The production Content-Security-Policy (`next.config.ts`) blocks third-party scripts. Vercel's toolbar and PostHog's toolbar won't load in production.
