# Bugout — Claude Context

## Project Purpose

**Bugout** is a Spanish-language e-commerce store selling emergency survival kits and gear. The tagline is *"La revolución de las mochilas de supervivencia para todos los públicos"*. It is a production-grade Next.js application demonstrating Clean Architecture / Domain-Driven Design (DDD) applied to a frontend project.

The checkout flow is a **simulation** (3-second timeout, no real payment processing). Products are served from a **static JSON file** by default, with optional API adapter support.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4 |
| Testing | Vitest 4, fast-check (property-based) |
| Analytics | PostHog (client + server) |
| Bundler | Turbopack (dev) |

---

## Architecture: Clean Architecture with DDD

Dependencies flow strictly inward — outer layers depend on inner ones, never the reverse.

```
Presentation (React components, hooks)
    ↓
Application (Use Cases, DTOs)
    ↓
Domain (Entities, Value Objects, Errors)
    ↑
Infrastructure (Adapters, Repositories, DI Container)
```

### Layer Locations

| Layer | Path |
|---|---|
| Domain | `src/domain/` |
| Application | `src/application/` |
| Infrastructure | `src/infrastructure/` |
| Presentation | `src/presentation/` + `src/components/` |
| Pages | `src/app/` (Next.js App Router) |

---

## Domain Layer (`src/domain/`)

### Entities

**`Product`** — Core product entity.
- Properties: `id`, `name`, `price`, `originalPrice`, `rating`, `reviews`, `description`, `category`, `inStock`, `badge`
- Key methods: `isOnSale()`, `discountPercentage()`, `isFeatured()`

**`Cart`** — Aggregate root managing shopping cart state.
- Key methods: `addItem()`, `removeItem()`, `clear()`, `totalAmount()`, `itemCount()`
- Business rule: max 99 items per product

**`CartItem`** — Entity representing a single line item in the cart.

### Value Objects (`src/domain/value-objects/`)

| Class | Constraint |
|---|---|
| `ProductId` | Non-empty string |
| `Money` | Non-negative number |
| `Quantity` | Positive integer |

All value objects are immutable and validate their invariants at construction time.

### Errors (`src/domain/errors/DomainError.ts`)

Custom error types: `ValidationError`, `NotFoundError`, `BusinessRuleError` — all extend `DomainError`.

---

## Application Layer (`src/application/`)

### Use Cases

| Use Case | Responsibility |
|---|---|
| `GetProductsUseCase` | Fetch all products from repository |
| `GetProductByIdUseCase` | Fetch a single product |
| `FilterProductsUseCase` | Filter by category/price/stock/sale + sort |
| `ManageCartUseCase` | Add, remove, clear cart; orchestrates both repos |

### Ports (Interfaces)

- `ProductRepository` — contract for reading product data
- `CartRepository` — contract for persisting cart state

These interfaces decouple use cases from any concrete data source.

---

## Infrastructure Layer (`src/infrastructure/`)

### Repository Adapters (`src/infrastructure/adapters/`)

| Adapter | Source |
|---|---|
| `JsonProductAdapter` | `/public/product_list.json` (default) |
| `ApiProductAdapter` | REST API with Bearer auth + exponential backoff retry (3 attempts) |
| `LocalStorageCartAdapter` | Browser `localStorage` key `"shopping-cart"` |

### Dependency Injection (`src/infrastructure/config/dependencies.ts`)

`DependencyContainer` is a singleton initialized once at app startup in `src/app/layout.tsx`. It wires all adapters to their interfaces. Controlled by environment variables:

| Variable | Values | Default |
|---|---|---|
| `NEXT_PUBLIC_PRODUCT_ADAPTER` | `"json"` / `"api"` | `"json"` |
| `NEXT_PUBLIC_API_BASE_URL` | URL string | — |
| `NEXT_PUBLIC_API_AUTH_TOKEN` | Bearer token | — |

---

## Presentation Layer

### Custom Hooks (`src/presentation/hooks/`)

| Hook | Wraps |
|---|---|
| `useProducts()` | `GetProductsUseCase` |
| `useCart()` | `ManageCartUseCase` |
| `useProductFilters(criteria)` | `FilterProductsUseCase` (memoized) |

Each hook manages its own loading/error state and calls the DI container for use case instances.

### Shared Components (`src/components/`)

- `Header` — Top navigation with cart icon toggle and mobile menu
- `Cart` — Sidebar drawer with line items, quantity controls, totals, and checkout CTA
- `Footer` — Site footer

### Pages (`src/app/`)

| Route | Description |
|---|---|
| `/` | Homepage with hero sections |
| `/products` | Product catalog with `CompactFilters` sidebar |
| `/products/[productName]` | Dynamic product detail page |
| `/checkout` | 4-step checkout: Contact → Shipping → Payment → Review |
| `/about` | About page |
| `/contact` | Contact page |

---

## Product Catalog

Stored in `/public/product_list.json`. Currently 6 products across two categories:

- `survival-kits` — 24H kit, 72H Backpack, Custom kit
- `accessories` — Emergency food, Water purification, First-aid kit

Price range: $39–$299. Products can have badges (`BESTSELLER`, `PREMIUM`, `SALE`).

---

## Key Data Flow Examples

**Add to cart:**
```
UI → useCart().addItem(id, qty)
  → ManageCartUseCase.addToCart()
    → ProductRepository.findById()  [validate product exists]
    → CartRepository.load()         [get current cart]
    → cart.addItem()                [enforce business rules]
    → CartRepository.save()         [persist to localStorage]
  → Hook updates React state
```

**Filter products:**
```
UI filter change → useProductFilters(criteria)
  → FilterProductsUseCase.execute(criteria)
    → ProductRepository.findAll()
    → Apply category / price / stock / sale filters
    → Sort by: featured | price-asc | price-desc | rating | reviews
  → Hook returns filtered list
```

---

## Testing

Run tests with `npm test`. Test files live alongside source files using `.test.ts` suffix.

Coverage includes: domain entities, value objects, all use cases, all adapters, DI container, and all custom hooks.

```
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run test     # Vitest unit tests
npm run lint     # ESLint
```

---

## Analytics

PostHog is integrated for both client and server-side tracking. Next.js rewrites proxy `/ingest/*` to PostHog EU servers to handle CORS and privacy correctly. See `next.config.ts` and `instrumentation-client.ts`.
