# Setting up Shopify for Bugout

This is a step-by-step guide to creating the Shopify store that backs the storefront (`NEXT_PUBLIC_COMMERCE_PROVIDER=shopify`). It is written against what the code actually reads, so follow the names exactly. The storefront stays on Next.js; Shopify provides the catalog, the cart and the hosted checkout (payments, tax, shipping, order emails).

Features Shopify cannot provide on its own (the newsletter signup and the contact form) are hidden while their backends are simulated. See the end of this guide.

---

## 1. Create the store

1. Sign up at [shopify.com](https://www.shopify.com). The **Basic** plan is enough, because headless storefronts that use Shopify's standard checkout work from Basic upwards. You can build on the free trial and choose the plan before launch; trial stores cannot take real orders.
2. When asked, set the store's country to **Spain**.
3. Note your store's `*.myshopify.com` domain (Settings → Domains). This is `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, e.g. `bugout.myshopify.com`.

## 2. General settings (Settings → General)

- **Store currency:** EUR. Set this before the first sale; changing it later is painful. The app throws a clear error if Shopify returns prices in any other currency.
- **Time zone:** (GMT+01:00) Madrid. **Unit system:** metric; default weight unit kg.
- **Store details / legal business name and address:** use the same values you will put in `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID` and `NEXT_PUBLIC_LEGAL_ADDRESS`. The LSSI requires them on the website.
- **Store language:** Spanish. The checkout is shown in the buyer's language, and the app requests Spanish (`@inContext(language: ES)`).

## 3. Markets (Settings → Markets)

- Keep **Spain** as the primary (and only) market, selling in **EUR**.
- Do not activate other countries for now. The app always queries in the Spain context (`@inContext(country: ES)`) and only ships within Spain.

## 4. Taxes (Settings → Taxes and duties)

- Register the Spanish VAT (IVA) collection for Spain. The standard rate of 21 % applies to these products.
- Turn on **"Include sales tax in product price and shipping rate"**. The app shows prices with IVA included, and so does its pricing policy (`pricesIncludeTax: true`).
- Canarias, Ceuta and Melilla are outside the IVA territory. They are excluded from shipping in step 5, so no special tax setup is needed while you don't ship there.

## 5. Shipping (Settings → Shipping and delivery)

The app quotes shipping from `src/infrastructure/config/pricingPolicy.ts`, while Shopify's checkout charges what you configure here. **The two must match.** If you change one, change the other.

1. In the **General shipping rates** profile, create one shipping zone named `España peninsular y Baleares`.
   - Add **Spain**, then expand it and **deselect** Las Palmas, Santa Cruz de Tenerife, Ceuta and Melilla.
   - The app rejects those postal codes (35, 38, 51, 52) at its own checkout too.
2. Add these rates to the zone:

| Rate name | Price | Condition | Matches `pricingPolicy.ts` |
|---|---|---|---|
| Estándar (3–5 días laborables) | 4,95 € | Order price 0 € – 74,99 € | `standard` 4,95 € |
| Estándar gratis (3–5 días laborables) | 0,00 € | Order price from 75,00 € | `standard` free from 75 € |
| Urgente (1–2 días laborables) | 9,95 € | none | `express` 9,95 € |
| 24 horas (1 día laborable) | 14,95 € | none | `overnight` 14,95 € |

3. Set the shipping origin (your warehouse) and give every product a **weight** (step 9), or rates may not apply.

## 6. Payments (Settings → Payments)

1. Activate **Shopify Payments**, which is available for Spain. It needs your business and bank details, and it handles cards, Apple Pay, Google Pay and PayPal-style wallets.
2. For testing, open **Shopify Payments → Manage → Enable test mode**. While test mode is on, no real payments are captured. Alternatively, use the **Bogus Gateway** for test orders.
3. Turn test mode **off** before launch.

## 7. Checkout and customer privacy

- **Settings → Checkout:**
  - Ask for email as the contact method.
  - Keep **"Show a checkbox for email marketing at checkout"** on, so buyers can give newsletter consent natively in Shopify. Customers who tick it appear as subscribed in Shopify, and you can email them later with Shopify Messaging.
  - Use the **checkout branding** editor to match the site: navy `#243C58`, button orange `#B84D00` (the accessible orange; don't use `#FF780C` behind white text), and the Bugout logo.
- **Settings → Customer privacy:** enable the cookie banner / privacy settings for the EU region. The site asks for consent itself (the PostHog banner). Passing that decision to the checkout (`visitorConsent`) is a pending code change; see step 14.
- **Settings → Policies:** add the refund, privacy, terms and shipping policies. Shopify links them in the checkout footer. Reuse the texts of `/shipping-returns`, `/privacy` and `/terms` so the site and checkout say the same.

## 8. Product metafields (Settings → Custom data → Products → Add definition)

Create these definitions. For **each one**, enable **Storefronts** access. Custom metafields are hidden from the Storefront API by default, and the site would silently show no details.

| Namespace and key | Type | Used for | Example value |
|---|---|---|---|
| `custom.badge` | Single line text | Product badge | `PREMIUM`, `SALE` or `BESTSELLER` (shown as "Premium", "Oferta", "Más vendido"; any other text is shown as-is) |
| `custom.features` | List of single line text | "Características" list | `Diseño ligero`, `Comida y agua para 24 horas` |
| `custom.specifications` | JSON | "Especificaciones" table | `[{"label":"Peso","value":"3,2 kg"},{"label":"Capacidad","value":"35 l"}]` |
| `custom.contents` | JSON | "Contenido del kit" list | `[{"item":"Manta térmica","quantity":"2"},{"item":"Linterna","quantity":"1 LED"}]` |

- Ratings are optional. If you install a reviews app that writes the standard `reviews.rating` and `reviews.rating_count` metafields (for example Judge.me, or Shopify's own product reviews metafields), the site shows stars, rating sort options and schema.org ratings automatically. Without them, no rating UI appears.
- Only show a badge you can back up. "SALE" makes sense when the product has a compare-at price; avoid "BESTSELLER" without sales data.
- If a warranty appears in the specifications, label it honestly: "Garantía legal: 3 años" is the statutory minimum, and a longer one is a "Garantía comercial".

## 9. Products (Products → Add product)

For each of the six products (the local catalog in `src/infrastructure/data/products.json` has the Spanish copy to paste):

- **Title and description:** Spanish.
- **Handle** (Search engine listing → URL handle): this becomes the URL `/products/<handle>`. Keeping the local catalog's ids keeps URLs stable: `24h-survival-backpack`, `72h-survival-backpack`, `custom-survival-kit`, `emergency-food-pack`, `water-purification-kit`, `first-aid-pro`.
- **Product type:** this becomes the category (filters, header and footer menus). It is slugified for the URL (`?category=`) and the label is rebuilt from that slug, so avoid accents in the type name. Use exactly two types:
  - `Kits de supervivencia` → category `kits-de-supervivencia`
  - `Accesorios` → category `accesorios`
- **Tags:** add `featured` to the two backpacks. Featured products lead the home page, and the kit with the most listed contents becomes the showcase.
- **Price** and **Compare-at price:** the compare-at price shows as the struck-through "previous price". Under the EU/Spanish price-reduction rule, it must be the lowest price of the previous 30 days.
- **Inventory:** track quantity and set stock. Out-of-stock products show as "Agotado" and cannot be added to the cart.
- **Shipping:** "This is a physical product", plus a weight.
- **Media:** square photos, 1024 px or larger, with alt text. Products without photos show a neutral placeholder. The site allows `cdn.shopify.com` images.
- **Metafields:** fill in the four definitions from step 8.
- **Publishing / sales channels:** make sure every product is available on the **Headless** channel (step 10), or the Storefront API won't return it.
- Each product uses a single variant. The site sells the product's first variant.

## 10. Headless channel and API tokens

1. Install the **Headless** sales channel from the Shopify App Store ([apps.shopify.com/headless](https://apps.shopify.com/headless)).
2. **Sales channels → Headless → Add storefront.** Shopify creates a public and a private Storefront API token.
3. In **Storefront API permissions → Edit**, enable at least reading products, product listings and inventory, reading and writing carts/checkouts, and reading metafields/metaobjects if listed. Keep everything else off.
4. Copy the **public access token**: this is `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`. It is designed to be visible in the browser.
5. Store the **private access token** somewhere safe but **do not** put it in a `NEXT_PUBLIC_` variable. It is only for future server-side use (step 14).
6. Back in **Products**, bulk-select all products → **Include in sales channels → Headless**.

## 11. Connect the app locally

Create `.env.local` in the repo (it is git-ignored):

```
NEXT_PUBLIC_COMMERCE_PROVIDER=shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=bugout.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=<public token>
# NEXT_PUBLIC_SHOPIFY_API_VERSION=2026-07   (default; keep it within Shopify's support window)
```

Then run `npm run dev` and check:

- **Catalog:** `/products` lists the six products, and the category filter shows "Kits de supervivencia" and "Accesorios".
- **Product pages:** a product page shows price, stock, badge, details from metafields and photos.
- **Cart and checkout:** add to cart → **Finalizar compra** takes you to the Shopify checkout. Shipping options and prices there match the site's quotes (step 5).
- **Test order:** pay with the test card from Shopify Payments test mode (or the Bogus Gateway). The order appears in **Orders**, and the site's cart is empty on return.

If the app fails at startup with a configuration error, a required variable is missing. If products are missing, check the Headless channel publication (step 9). If details are missing, check the metafield **Storefronts** access (step 8).

## 12. Deploy (Vercel)

In the Vercel project, set the same variables for **Production** and **Preview**, plus:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://bugout.es` (your production origin) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | the real support address (required by the LSSI) |
| `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID`, `NEXT_PUBLIC_LEGAL_ADDRESS` | the business identity (required by the LSSI) |
| `NEXT_PUBLIC_POSTHOG_KEY` | your PostHog project key, EU region (optional) |

`NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them. The production Content-Security-Policy automatically allows your Shopify store domain for the browser's cart calls.

**Checkout domain (Settings → Domains):** connect a subdomain such as `checkout.bugout.es` to Shopify, so shoppers see your brand during checkout instead of `*.myshopify.com`.

## 13. Go-live checklist

- [ ] Plan chosen (the trial ends and real orders need a paid plan).
- [ ] Shopify Payments **test mode off**.
- [ ] Shipping rates in Shopify match `pricingPolicy.ts`, and Canarias/Ceuta/Melilla are excluded.
- [ ] Taxes: IVA included in prices.
- [ ] All products published to Headless, with photos, weights, stock and metafields.
- [ ] Compare-at prices comply with the 30-day lowest-price rule.
- [ ] Policies filled in Shopify and consistent with the site's legal pages (ideally reviewed by a lawyer).
- [ ] Vercel env vars set, including the site URL, contact email and legal identity.
- [ ] One real order placed and refunded end to end.

## 14. Pending code work for the Shopify phase

These don't block the setup above, but are the next development steps:

1. **Consent to checkout:** pass the site's cookie decision to Shopify with `@inContext(visitorConsent: {analytics, marketing, preferences, saleOfData})` on cart creation (Storefront API 2025-10+; the app uses 2026-07). Shopify then carries it into the `checkoutUrl`.
2. **Server-side token:** use the Headless channel's private token (`Shopify-Storefront-Private-Token` header, server-only env var) for Server Component catalog requests, and add `Shopify-Storefront-Buyer-IP` when a request comes from a real visitor.
3. **Purchase analytics:** add an `orders/paid` webhook handler (HMAC-verified, idempotent) that sends `order_completed` to PostHog server-side. Optionally add a Shopify custom pixel on `checkout_completed`.

## Hidden for now: features Shopify doesn't cover

- **Newsletter signup form:** Shopify's Storefront API only offers a newsletter-only signup in its `unstable` version. A stable integration needs the Admin API (a secret token, so server-side) or an email-marketing app such as Klaviyo or Brevo. Until then, newsletter consent is collected at Shopify's checkout (step 7).
- **Contact form:** Shopify has no contact-form API for headless storefronts. It needs an email provider or helpdesk.

Both forms are hidden while `getContainer().isMessagingSimulated()` is true. Customers are pointed to `NEXT_PUBLIC_CONTACT_EMAIL` instead. When real `NewsletterService` / `ContactService` adapters are connected and the flag returns false, the forms reappear.
