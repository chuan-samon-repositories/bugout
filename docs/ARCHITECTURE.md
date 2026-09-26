# Bugout architecture

Bugout is a Spanish-language (es-ES, EUR) storefront for survival kits built with Next.js 15 (App Router), React 19, TypeScript (strict) and Tailwind CSS 4. The code follows Clean Architecture: dependencies point inward only.

```
app/ (routes)  →  presentation/  →  application/  →  domain/
                                     ↑
                         infrastructure/ (adapters, DI container)
```

- **domain/** — entities and value objects with invariants. No framework, no I/O.
- **application/** — use cases, ports (interfaces), DTOs, pure query helpers, the analytics event catalogue.
- **infrastructure/** — adapters implementing ports (JSON catalog, localStorage, Shopify Storefront API, PostHog) and the dependency container.
- **presentation/** — React components, contexts, hooks, i18n copy, formatting, routes.
- **app/** — Next.js routes only: fetch data through the container and render presentation components.

Imports use the `@/` alias. `domain` imports nothing outside itself; `application` imports only `domain`; `presentation` never imports adapters directly, only the container.

## Commerce providers

`NEXT_PUBLIC_COMMERCE_PROVIDER` selects the backend (`local` by default):

| Concern | `local` | `shopify` |
|---|---|---|
| Catalog | `JsonProductAdapter` (`infrastructure/data/products.json`) | `ShopifyProductAdapter` (Storefront API) |
| Cart | `LocalStorageCartAdapter` (stores ids + quantities, re-prices from catalog) | `ShopifyCartAdapter` (Shopify cart, line mutations) |
| Checkout | `LocalCheckoutAdapter` → in-app `/checkout` (demo, no payment) | `ShopifyCheckoutAdapter` → hosted Shopify checkout |
| Orders | `LocalOrderGateway` (simulated) | Shopify (hosted checkout) |

Shopify env: `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` (public Storefront token), optional `NEXT_PUBLIC_SHOPIFY_API_VERSION`. Selecting `shopify` without them fails fast at startup.

Newsletter and contact use local adapters that only simulate delivery until a mail/CRM backend is connected.

## Dependency container

`getContainer()` (`infrastructure/config/container.ts`) lazily builds a singleton from environment variables on first use, on server and client alike. Adapter instances are cached, so every use case shares the same repositories. Tests call `resetContainer()` / `createContainer(config)`.

Container API used by `app/` and `presentation/`:

| Method | Returns |
|---|---|
| `getProvider()` | `'local' \| 'shopify'` |
| `getPricingPolicy()` | `PricingPolicy` (currency, shipping rates, tax) |
| `getGetProductsUseCase()` | `execute(): Promise<Product[]>` |
| `getGetProductBySlugUseCase()` | `execute(slug): Promise<Product>` (throws `NotFoundError`) |
| `getManageCartUseCase()` | `getCart / addToCart / setQuantity / removeFromCart / deleteFromCart / clearCart`, all resolving to the updated `Cart` |
| `getCreateCheckoutUseCase()` | `execute(): Promise<{ url, type: 'local' \| 'hosted' }>` |
| `getPlaceOrderUseCase()` | `execute(details): Promise<OrderConfirmation>` (throws `FormValidationError`) |
| `getSubscribeNewsletterUseCase()` | `execute(email): Promise<void>` (throws `FormValidationError`) |
| `getSendContactMessageUseCase()` | `execute(message): Promise<void>` (throws `FormValidationError`) |
| `getAnalyticsService()` | `AnalyticsService` (PostHog when configured, otherwise no-op) |
| `getConsentRepository()` | `ConsentRepository` |

Pure helpers in `application/catalog/`: `applyFilterCriteria(products, criteria)`, `summarizeCategories(products)`, `priceBounds(products)`. In `application/checkout/`: `validateCheckoutDetails(details, step)`.

`FormValidationError` (`application/errors.ts`) carries `fieldErrors: Record<string, ValidationCode>` where `ValidationCode` is `'required' | 'invalidEmail' | 'invalidPhone' | 'invalidPostalCode' | 'tooShort' | 'tooLong'`. The UI maps codes to copy.

## Domain rules

- `Money` is integer minor units plus an ISO currency. Never do arithmetic on `amount`; use `add`, `multiply` and so on.
- `Cart` holds at most `MAX_QUANTITY_PER_ITEM` (99) per product, rejects out-of-stock products and mixed currencies, and throws `BusinessRuleError` with a `code`.
- `Product.slug` is the URL handle; `Product.id` is the backend id (a Shopify variant GID when Shopify is active).
- `rating` is `null` when there is no review data; hide ratings in that case.
- Shipping and tax come only from `PricingPolicy` (`calculateOrderTotals`, `freeShippingThreshold`). Never hardcode thresholds in UI copy.

## Presentation conventions

- **Copy:** all user-visible strings live in `presentation/i18n/messages/<area>.ts` (Spanish). Components read `messages.<area>.<key>`. Format prices with `formatMoney`, and map errors with `toUserMessage`.
- **Routes:** build links with `presentation/routes.ts` (`routes`, `catalogUrl`). Don't link to pages that don't exist.
- **Colors:** use theme tokens from `globals.css` (`bg-navy`, `text-accent`, `bg-accent`, `border-sand`, …), not raw hex. Orange buttons use `bg-accent` (white text passes WCAG AA); `text-orange` is decorative only.
- **Components:** reuse primitives in `presentation/components/ui` (Button, ButtonLink, Container, Drawer, FormField inputs, PriceTag, RatingStars, ProductBadge, Spinner, icons). Feature components live in `presentation/components/<feature>/`.
- **State:** `CartProvider` (`useCart`), `NotificationProvider` (`useNotifications`), `AnalyticsProvider` (`useAnalytics`, `useConsent`) are mounted once in `app/Providers.tsx`.
- **Server first:** pages are Server Components that load data via the container; only interactive parts are Client Components.
- **Accessibility:** every control has an accessible name; dialogs trap focus, close on Escape and restore focus; form fields have associated labels and error text via `aria-describedby`; one `<h1>` per page; motion respects `prefers-reduced-motion`.
- **Honesty:** no fabricated ratings, reviews, stock or marketing figures, and no success messages for actions that did nothing.

## Analytics

Events are typed in `application/analytics/events.ts` and sent through `AnalyticsService`. PostHog loads lazily, only after the visitor accepts analytics cookies in the consent banner. Before consent nothing is sent and no cookies are written. The PostHog client is proxied through `/ingest` (see `next.config.ts`). Env: `NEXT_PUBLIC_POSTHOG_KEY`, optional `NEXT_PUBLIC_POSTHOG_HOST` (default `/ingest`).

## Testing

- `npm test`: Vitest for domain, application, infrastructure (node) and React components/contexts (jsdom via `// @vitest-environment jsdom`, Testing Library).
- `npm run e2e`: Playwright end-to-end tests against a production build (`e2e/`).
- `npm run lint`, `npm run typecheck`, `npm run build`: all must pass (CI runs them).
