# Commerce Backend Options

> **Status:** Option B is implemented. The Shopify adapters (catalog, cart, hosted checkout) exist in `src/infrastructure/adapters/` and are enabled with `NEXT_PUBLIC_COMMERCE_PROVIDER=shopify` (see [ARCHITECTURE.md](ARCHITECTURE.md)). A Medusa backend would need a new set of adapters behind the same ports. The comparison below is kept for reference.

## Option A — Medusa.js (self-hosted, open source)

**Process:** Spin up Medusa server + Postgres + Redis → migrate products → write adapter layer in Next.js → rebuild checkout against real API → deploy backend separately.

**Pros**
- Full control over checkout UI and business logic
- No monthly SaaS fee (infra costs ~$10–15/mo)
- No vendor lock-in

**Cons**
- You manage infra (Postgres, Redis, server)
- More setup time (~1–2 weeks to production)

---

## Option B — Shopify Headless (managed SaaS)

**Process:** Create Shopify store → add products in Admin → enable Storefront API → write adapter layer in Next.js → redirect to Shopify-hosted checkout.

**Pros**
- Zero infra to manage
- Payments, emails, tax, shipping all built-in
- Fastest path to production

**Cons**
- $29+/mo forever
- No control over the checkout page (locked to Shopify's hosted flow)
- Vendor lock-in

---

## Recommendation

Both require the same adapter work in your codebase. Choose **Medusa** for control and cost; choose **Shopify** to ship fast without touching infra.
