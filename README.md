# Bugout

Online shop for survival backpacks and emergency gear (*"La revolución de las mochilas de supervivencia para todos los públicos"*). The storefront UI is in Spanish (`es-ES`), prices are in euros with 21 % IVA included, and orders ship within Spain: the peninsula and the Balearic Islands.

Built with Next.js 15 (App Router), React 19, TypeScript (strict) and Tailwind CSS 4, following Clean Architecture (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).

## Requirements

- Node.js 22 or newer
- npm (the repo ships a `package-lock.json`)

## Setup

```bash
npm ci
cp .env.example .env.local   # optional: the defaults run the local demo store
npm run dev                  # http://localhost:3000
```

No variable is required for local development. With no configuration the app runs the local demo provider with analytics disabled.

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

- Catalog: `src/infrastructure/data/products.json` (6 products, in the categories `survival-kits` and `accessories`).
- Cart: stored in `localStorage` as product ids and quantities. Prices are always re-read from the catalog.
- Checkout: the in-app `/checkout` page (contact → shipping → review). It is a demo: no payment is taken and no real order is placed.

### `shopify`

Set:

```
NEXT_PUBLIC_COMMERCE_PROVIDER=shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=<public Storefront API token>
# optional, defaults to 2026-07
NEXT_PUBLIC_SHOPIFY_API_VERSION=2026-07
```

- Catalog and cart come from the Storefront API.
  - Categories come from the product type.
  - Products tagged `featured` are featured.
  - `custom.badge`, `custom.features`, `custom.specifications` and `custom.contents` metafields provide merchandising content.
  - `reviews.rating` and `reviews.rating_count` metafields provide ratings.
- The cart is a Shopify cart; its id is kept in `localStorage`.
- Checkout redirects to Shopify's hosted checkout, which handles payment and order placement.
- If the store domain or token is missing, the app fails at startup with a `ConfigurationError`.

The storefront token is a public token meant to be exposed to browsers. Never put an Admin API token in these variables. Shipping rates shown in the storefront come from `src/infrastructure/config/pricingPolicy.ts` in both modes, so keep Shopify's shipping settings in line with it.

Newsletter sign-up and the contact form are not connected to a backend yet. They simulate success and send nothing.

## Analytics and consent

- Product analytics use PostHog and are enabled only when `NEXT_PUBLIC_POSTHOG_KEY` is set.
- The PostHog SDK is loaded only after the visitor accepts analytics cookies in the consent banner. Before that, no events are sent and no analytics cookies are written. Visitors can change their choice from the footer or the cookie policy page.
- Events are a typed catalogue in `src/application/analytics/events.ts`.
- Requests go through a first-party reverse proxy at `/ingest` to PostHog's EU region (`next.config.ts`). `NEXT_PUBLIC_POSTHOG_HOST` overrides the ingestion host (default `/ingest`).

## Testing

- `npm test` runs Vitest. Tests live next to the code (`*.test.ts` / `*.test.tsx`). Component tests use jsdom and Testing Library.
- `npm run e2e` runs Playwright specs from `e2e/` against a production build.
  - Playwright starts `next start` on port 3100 (`E2E_PORT`).
  - Set `E2E_SKIP_SERVER=1` to target an already running server.
  - It runs desktop and mobile (Pixel 7) projects.
  - Install browsers once with `npx playwright install chromium`.
- CI (`.github/workflows/ci.yml`) runs on pushes to `master` and on pull requests: lint, typecheck, unit tests, build and E2E.

## Deployment notes

- Set `NEXT_PUBLIC_SITE_URL` to the production origin. It is used for canonical URLs, Open Graph metadata, `sitemap.xml`, `robots.txt` and product structured data, and defaults to `http://localhost:3000`.
- Set the seller identity required by Spanish law (LSSI) before launch: `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID` and `NEXT_PUBLIC_LEGAL_ADDRESS`. Optionally set `NEXT_PUBLIC_CONTACT_EMAIL`. Fields left unset are hidden on the legal and contact pages.
- `next.config.ts` sends these security headers on every route: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY` and a restrictive `Permissions-Policy`. It also disables `X-Powered-By`.
- The `/ingest/*` PostHog proxy is a Next.js rewrite, so it works on any host that runs the Next.js server.
- `/checkout` is excluded in `robots.txt` and marked `noindex`.

## Project structure

```
src/
  app/             Routes: /, /products, /products/[slug], /checkout, /about, /contact,
                   /shipping-returns, /privacy, /cookies, /terms, sitemap.ts, robots.ts
  presentation/    React components (ui/ design system + feature folders), contexts,
                   hooks, i18n (Spanish copy and formatting), routes.ts, config/site.ts
  application/     Use cases, ports (interfaces), DTOs, analytics event catalogue
  domain/          Entities (Product, Cart, OrderPricing) and value objects (Money, ...)
  infrastructure/  Adapters (JSON catalog, localStorage, Shopify, PostHog), DI container,
                   env parsing, pricing policy, bundled catalog data
e2e/               Playwright specs
docs/              Architecture and backend notes
public/images/     Hero and product images
```

For AI coding agents, see [CLAUDE.md](CLAUDE.md).
