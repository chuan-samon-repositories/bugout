# Bugout

Online shop for survival backpacks and emergency gear (*"La revolución de las mochilas de supervivencia para todos los públicos"*). The storefront UI is in Spanish (`es-ES`), prices are in euros with 21 % IVA included, and orders ship within Spain: the peninsula and the Balearic Islands.

Built with Next.js 15 (App Router), React 19, TypeScript (strict) and Tailwind CSS 4, following Clean Architecture (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)). The shop is organised around three kits (Kit 24h and Kit 72h, each for 1, 2 or 4 people, and the build-your-own Kit Custom) plus the loose products they contain. The visual design (Montserrat, sand/navy/orange palette; a pixel-art frog mascot that is currently hidden) is documented in [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

## Requirements

- Node.js 22 or newer
- npm (the repo ships a `package-lock.json`)

## Setup

```bash
npm ci
cp .env.example .env.local   # optional: the defaults run the local demo store
npm run dev                  # http://localhost:3000
```

No variable is required for local development. With no configuration the app runs the local demo provider with analytics disabled. Before a public launch, `NEXT_PUBLIC_CONTACT_EMAIL` and the `NEXT_PUBLIC_LEGAL_*` variables are required (see [Deployment notes](#deployment-notes)).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit and component tests (single run) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run e2e` | Playwright end-to-end tests (run `npm run build` first) |

## Commerce providers

`NEXT_PUBLIC_COMMERCE_PROVIDER` picks the backend. Every variable is `NEXT_PUBLIC_*` and inlined at build time, so rebuild after changing one.

### `local` (default)

- Catalog: `src/infrastructure/data/products.json`: 3 kits (the Kit 24h and the Kit 72h with 1/2/4-person variants) and 17 loose products with photos, in the categories `kits`, `agua`, `luz-y-energia`, `primeros-auxilios`, `refugio-y-abrigo`, `herramientas` and `higiene`. Prices, weights and contents are placeholder demo data.
- Cart: stored in `localStorage` as product ids and quantities. Prices are always re-read from the catalog.
- Checkout: the in-app `/checkout` page (contact → shipping → review). It is a demo: no payment is taken and no real order is placed.

### `shopify`

Create the store first by following [docs/SHOPIFY_SETUP.md](docs/SHOPIFY_SETUP.md), then set:

```
NEXT_PUBLIC_COMMERCE_PROVIDER=shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=<public Storefront API token>
# optional, defaults to 2026-07
NEXT_PUBLIC_SHOPIFY_API_VERSION=2026-07
```

- Catalog and cart come from the Storefront API.
  - Categories come from the product type (use the Spanish names in the setup guide, e.g. `Luz y energía` → `luz-y-energia`).
  - Kit sizes are Shopify variants with a `Personas` option; each size is its own cart line.
  - Products tagged `featured` are featured.
  - `custom.badge`, `custom.features`, `custom.specifications`, `custom.contents` (with optional product `handle`s), `custom.kit` and `custom.related` metafields provide merchandising content and mark kits.
  - `reviews.rating` and `reviews.rating_count` metafields provide ratings. Ratings and rating-based sorting appear only when real review data exists; the demo catalog has none.
  - Products that can't be mapped are skipped with a warning in the server log.
- All Storefront API calls use the Spain context (`@inContext(country: ES, language: ES)`), so the Shopify market for Spain must sell in EUR. A cart priced in another currency fails with an error.
- Catalog responses are cached for 300 seconds. Cart calls are never cached.
- The cart is a Shopify cart; its id is kept in `localStorage`.
- Checkout redirects to Shopify's hosted checkout, which handles payment and order placement.
- If the store domain or token is missing, the app fails at startup with a `ConfigurationError`.

The storefront token is a public token meant to be exposed to browsers. Never put an Admin API token in these variables. Shipping rates and taxes shown in the storefront come from `src/infrastructure/config/pricingPolicy.ts` in both modes. Configure Shopify's shipping zones and rates to match it, including excluding Canarias, Ceuta and Melilla.

Newsletter sign-up and the contact form are not connected to a backend yet, so they are hidden: the home page and footer show no sign-up, `/contact` shows only quick help and FAQ, and the local checkout offers no marketing opt-in. They reappear once a real backend is connected (`isMessagingEnabled()` in `src/presentation/config/messaging.ts`).

## Analytics and consent

- Product analytics use PostHog and are enabled only when `NEXT_PUBLIC_POSTHOG_KEY` is set.
- The PostHog SDK is loaded only after the visitor accepts analytics cookies in the consent banner. Before that, no events are sent and no analytics cookies are written. Visitors can change their choice from the footer or the cookie policy page.
- Events are a typed catalogue in `src/application/analytics/events.ts`. No personal data is sent: there is no `identify` call, and checkout sections with customer data are excluded from autocapture (`ph-no-capture`). Session recording and feature flags are disabled.
- Withdrawing consent opts PostHog out and deletes its cookies (including those on parent domains) and storage, keeping only its opt-out marker. A restored consent opts in silently on each page load; only a visitor's Accept is recorded as an opt-in.
- Requests go through a first-party reverse proxy at `/ingest` to PostHog's EU region (`next.config.ts`). `NEXT_PUBLIC_POSTHOG_HOST` overrides the ingestion host (default `/ingest`). A custom absolute host, such as PostHog Cloud or a self-hosted instance, is supported: the production CSP allows it automatically.

## Testing

- `npm test` runs Vitest. Tests live next to the code (`*.test.ts` / `*.test.tsx`). Component tests use jsdom and Testing Library.
- `npm run e2e` runs Playwright specs from `e2e/` against a production build.
  - Playwright starts `next start` on port 3100 (`E2E_PORT`).
  - Set `E2E_SKIP_SERVER=1` to target an already running server.
  - It runs desktop and mobile (Pixel 7) projects with reduced motion. Specs cover smoke, navigation, catalog, kits, cart, purchase, forms, consent and accessibility (axe).
  - Install browsers once with `npx playwright install --with-deps chromium`, the same command CI uses.
- CI (`.github/workflows/ci.yml`) runs on pushes to `master` and `develop` and on pull requests: lint, typecheck, unit tests, build and E2E.

## Deployment notes

- **Branch rules:** `master` is production and `develop` is the test environment; every change goes through `develop` first. Read [docs/WORKFLOW.md](docs/WORKFLOW.md) before working on the code. Claude Code follows the same rules (CLAUDE.md, "Branches and releases"), reinforced by the hooks in `.claude/`.
- Vercel deploys through its Git integration on every push; CI does not deploy. `master` is the Production branch (`bugout.es`). `develop` builds as a Preview deployment, and the `test.bugout.es` domain is assigned to that branch.
  - The test site is public to anyone with the URL but hidden from search engines: on every deployment whose `VERCEL_ENV` is not `production`, `next.config.ts` sends `X-Robots-Tag: noindex, nofollow` and `robots.txt` disallows everything (`siteConfig.indexable`). Vercel does this for preview URLs itself, but not for a custom domain bound to a preview branch. This doesn't stop crawlers that ignore robots rules; for real access control, use Vercel Deployment Protection.
  - Preview env vars scoped to the `develop` branch: `NEXT_PUBLIC_SITE_URL=https://test.bugout.es`, a Shopify development store (or `local`) instead of the live store, and no PostHog key (or a separate PostHog project).
- Set `NEXT_PUBLIC_SITE_URL` to the production origin (a bare host gets `https://` added). It is used for canonical URLs, Open Graph metadata, `sitemap.xml`, `robots.txt` and product structured data. Without it, the app uses `https://$VERCEL_PROJECT_PRODUCTION_URL` (set automatically on Vercel), then `http://localhost:3000`. A production build logs a warning when it falls back to localhost.
- **Required before launch (LSSI):** `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID` and `NEXT_PUBLIC_LEGAL_ADDRESS`. Unset fields are silently hidden on the legal and contact pages, so the build won't fail if they are missing. While the contact form is hidden, the email is the only way customers can reach the shop; without it the contact page offers no channel at all.
- `next.config.ts` sends these security headers on every route: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, a restrictive `Permissions-Policy` and `Strict-Transport-Security`. It also disables `X-Powered-By`.
  - Production builds also send a Content-Security-Policy. It allows same-origin scripts and connections, `cdn.shopify.com` images, and the Shopify store domain. A custom absolute PostHog host is added to `script-src` and `connect-src`, together with its `-assets` host for PostHog Cloud.
  - The CSP blocks third-party scripts, so the Vercel and PostHog toolbars don't load in production.
- Home, product pages, the kit guide pages (`/how-to-choose`, `/why-prepare`, `/faq`) and the sitemap use `revalidate = 300` (ISR): pages are cached and refreshed at most every 5 minutes.
- Shopify product images from `cdn.shopify.com` are allowed in `images.remotePatterns`.
- The `/ingest/*` PostHog proxy is a Next.js rewrite, so it works on any host that runs the Next.js server.
- `/checkout` is excluded in `robots.txt` and marked `noindex`.
- Pricing law: strike-through "before" prices (`originalPrice`) must be the lowest price of the previous 30 days (EU/Spanish price-reduction rule). The business is responsible for this when setting prices.

## Project structure

```
src/
  app/             Routes: /, /products, /products/[slug], /how-to-choose, /why-prepare, /faq,
                   /checkout, /about, /contact, /shipping-returns, /privacy, /cookies, /terms,
                   sitemap.ts, robots.ts
  presentation/    React components (ui/ design system + feature folders), contexts,
                   hooks, i18n (Spanish copy and formatting), routes.ts, config/site.ts
  application/     Use cases, ports (interfaces), DTOs, analytics event catalogue
  domain/          Entities (Product, Cart, OrderPricing) and value objects (Money, ...)
  infrastructure/  Adapters (JSON catalog, localStorage, Shopify, PostHog), DI container,
                   env parsing, pricing policy, bundled catalog data
e2e/               Playwright specs
docs/              Architecture, design system and backend notes
public/images/     Brand art, the frog mascot and product photos
```

For AI coding agents, see [CLAUDE.md](CLAUDE.md).
