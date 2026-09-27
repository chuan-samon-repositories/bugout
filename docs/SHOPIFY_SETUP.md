# Setting up Shopify for Bugout

This is a step-by-step guide to creating the Shopify store that backs the storefront (`NEXT_PUBLIC_COMMERCE_PROVIDER=shopify`). It is written against what the code actually reads, so follow the names exactly. The storefront stays on Next.js; Shopify provides the catalog, the cart and the hosted checkout (payments, tax, shipping, order emails).

Features Shopify cannot provide on its own (the newsletter signup and the contact form) are hidden while their backends are simulated. See the end of this guide.

---

## 1. Create the store

1. Sign up at [shopify.com](https://www.shopify.com). The **Basic** plan is enough, because headless storefronts that use Shopify's standard checkout work from Basic upwards. You can build on the free trial and choose the plan before launch; trial stores cannot take real orders.
2. When asked, set the store's country to **Spain**.
3. Note your store's `*.myshopify.com` domain (Settings → Domains). This is `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, e.g. `bugout.myshopify.com`.

## 2. General settings (Settings → General)

- **Store currency:** EUR. Set this before the first sale; changing it later is painful. The store currency the app expects comes from `storePricingPolicy.currency` (`src/infrastructure/config/pricingPolicy.ts`). A catalog product priced in any other currency is left out of the site with a `[shopify] Skipping product …` warning in the server log, and a cart line in another currency makes the cart fail with a clear error.
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
  - Use the **checkout branding** editor to match the site: navy `#243C58`, button orange `#FF780C` with navy text `#172938` (white text on that orange fails WCAG AA), background `#EEE8CE`, the Montserrat font if offered, and the Bugout logo (`public/images/brand/`).
- **Settings → Customer privacy:** enable the cookie banner / privacy settings for the EU region. The site asks for consent itself (the PostHog banner) and passes the decision to the checkout (`@inContext(visitorConsent: …)` at the hand-off), so visitors who already chose are not asked again.
- **Settings → Customer events** and **Settings → Notifications → Webhooks:** the analytics pixel and the order webhooks; see [ANALYTICS.md](ANALYTICS.md#setup-outside-the-code-carlos).
- **Settings → Policies:** add the refund, privacy, terms and shipping policies. Shopify links them in the checkout footer. Reuse the texts of `/shipping-returns`, `/privacy` and `/terms` so the site and checkout say the same.

## 8. Product metafields (Settings → Custom data → Products → Add definition)

Create these definitions. For **each one**, enable **Storefronts** access. Custom metafields are hidden from the Storefront API by default, and the site would silently show no details (or, for `custom.position`, keep Shopify's creation order).

| Namespace and key | Type | Used for | Example value |
|---|---|---|---|
| `custom.badge` | Single line text | Product badge | `PREMIUM`, `SALE` or `BESTSELLER` (shown as "Premium", "Oferta", "Más vendido"; any other text is shown as-is) |
| `custom.features` | List of single line text | "Características" list | `Diseño ligero`, `Comida y agua para 24 horas` |
| `custom.specifications` | JSON | "Especificaciones" table | `[{"label":"Peso","value":"3,2 kg"},{"label":"Capacidad","value":"35 l"}]` |
| `custom.contents` | JSON | Kit contents ("Contenido completo" and the "Qué hay dentro" grid) | `[{"item":"Manta térmica","quantity":"2","handle":"manta-termica"},{"item":"Botellas de agua de 330 ml","quantity":"6"}]` |
| `custom.kit` | JSON | Marks the product as a kit | `{"label":"72H","idealFor":"Pensado para evacuaciones…"}`; the Kit Custom adds `"buildYourOwn":true` |
| `custom.related` | List of single line text | "Añade productos" cross-sell, in order | `lampara-camping`, `mochila-65l` (product handles) |
| `custom.long_description` | Multi-line text | The longer text of the product page (`details.longDescription`); without it the page shows the Shopify description | `Pensado para cortes de luz, evacuaciones cortas…` (copy it from `longDescription` in `products.json`) |
| `custom.position` | Integer | Catalog order: the header and footer kit links, the kit cards, the home "24h vs 72h" comparison, the category chips and the featured products all follow it. Lowest first; products without it go after, in Shopify's order (creation order) | `1` |

- In `custom.specifications` and `custom.contents`, `value` and `quantity` may be JSON strings (`"2"`) or numbers (`2`).
- In `custom.contents`, `handle` is optional: give it when the line is a product sold separately, and the site shows its photo, links to it and adds "Incluido en el Kit 72h" to that product's card. Lines without a handle (water, food rations…) show a placeholder.
- A product is shown as a kit (kit card, variant chips, comparison table, contents) only when `custom.kit` has a `label`. The comparison table rows come from the kits' `custom.specifications`, so use the same labels on every kit (`Peso`, `Dimensiones`, `Caducidad de los consumibles`).

- Ratings are optional. If you install a reviews app that writes the standard `reviews.rating` and `reviews.rating_count` metafields (for example Judge.me, or Shopify's own product reviews metafields), the site shows stars, rating sort options and schema.org ratings automatically. Those two definitions need **Storefronts** access too (Settings → Custom data → Products → the `reviews` definitions); many apps leave it off. Without them, no rating UI appears.
- Only show a badge you can back up. "SALE" makes sense when the product has a compare-at price; avoid "BESTSELLER" without sales data.
- If a warranty appears in the specifications, label it honestly: "Garantía legal: 3 años" is the statutory minimum, and a longer one is a "Garantía comercial".

## 9. Products (Products → Add product)

Create the 3 kits and the 17 loose products of the local catalog (`src/infrastructure/data/products.json` has the Spanish copy, the prices, the contents and the cross-sells to paste; the photos are in `public/images/products/`):

- **Title and description:** Spanish. For kits, the description is the short line under the title; put the longer text (`details.longDescription` in the JSON) in the `custom.long_description` metafield.
- **Search engine listing** (Search engine listing → Edit): the page title and meta description that Google shows. The site reads them as `Product.seo` and falls back to the title and description when they are empty. Copy them from `seo` in `products.json` (the kits and several loose products have one), for example `Kit de emergencia 72 horas para 1, 2 o 4 personas`. Keep titles under about 50 characters, since the site appends " · Bugout".
- **Handle** (Search engine listing → URL handle): this becomes the URL `/products/<handle>`. Keep the local catalog's slugs so URLs and `custom.contents` / `custom.related` handles line up: `kit-24h`, `kit-72h`, `kit-custom`, `mochila-30l`, `manta-termica`, `radio-solar`…
- **Product type:** this becomes the category (the chips on `/products`). It is slugified for the URL, so these types give exactly the local slugs, whose Spanish labels the site already has:

  | Product type | Category slug |
  |---|---|
  | `Kits` | `kits` |
  | `Agua` | `agua` |
  | `Comida` | `comida` |
  | `Luz y energía` | `luz-y-energia` |
  | `Primeros auxilios` | `primeros-auxilios` |
  | `Refugio y abrigo` | `refugio-y-abrigo` |
  | `Herramientas` | `herramientas` |
  | `Higiene` | `higiene` |

- **Variants (kits):** give the Kit 24h and the Kit 72h an option named **`Personas`** with the values `1`, `2` and `4`. Shopify builds each variant's title from the value ("2"); the site composes "1 persona", "2 personas", "4 personas" from it for the chips, the cart and order lines and the spec table's "Para" row, as in the local catalog. Values that already read "2 personas" also work: they are shown as they are, and the comparison table and kit cards still read the number from them. The option name is matched without regard to case or accents. Each variant has its own price, compare-at price and stock. The site shows the option as chips, selects the first variant in stock and puts each size in the cart as its own line ("Kit 72h · 2 personas"). The Kit Custom and the loose products keep Shopify's single default variant.
- **Order (`custom.position`):** set it to `1`, `2`, `3` on the Kit 24h, the Kit 72h and the Kit Custom, in that order, then continue with the loose products in the order of `products.json` (4 to 20). The site sorts the catalog by it, so the kits come first in the menus and the home comparison reads "24h vs 72h". Without it, products appear in the order they were created.
- **Tags:** add `featured` to the Kit 24h and the Kit 72h. The kit with the most contents becomes the "Compra ahora" target and the "Qué hay dentro" showcase.
- **Price** and **Compare-at price:** the compare-at price shows as the struck-through "previous price". Under the EU/Spanish price-reduction rule, it must be the lowest price of the previous 30 days.
- **Inventory:** track quantity and set stock. Out-of-stock products or variants show as "Agotado" and cannot be added to the cart. When a cart asks for more units than are left, Shopify keeps only the units in stock (or none), and the site shows the cart Shopify holds with a notice ("Solo quedan 2 unidades de …", "Hemos quitado … de tu carrito porque ya no está disponible").
- **Shipping:** "This is a physical product", plus a weight.
- **Media:** square photos, 900 px or larger, ideally on the brand navy like the catalog photos, with alt text. Kits without photos show a decorative navy box with the kit label and a grid of their contents' photos. The site allows `cdn.shopify.com` images.
- **Metafields:** fill in the definitions from step 8 (`custom.kit`, `custom.contents` and `custom.related` on kits).
- **Publishing / sales channels:** make sure every product is available on the **Headless** channel (step 10), or the Storefront API won't return it.
- The site reads up to 20 variants per product.

## 10. Headless channel and API tokens

1. Install the **Headless** sales channel from the Shopify App Store ([apps.shopify.com/headless](https://apps.shopify.com/headless)).
2. **Sales channels → Headless → Add storefront.** Shopify creates a public and a private Storefront API token.
3. In **Storefront API permissions → Edit**, enable at least reading products, product listings and inventory, reading and writing carts/checkouts, and reading metafields/metaobjects if listed. Keep everything else off.
4. Copy the **public access token**: this is `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`. It is designed to be visible in the browser.
5. Store the **private access token** somewhere safe but **do not** put it in a `NEXT_PUBLIC_` variable: every `NEXT_PUBLIC_` value is published in the browser bundle. It is only for future server-side use (step 14). The same goes for any Admin API token. The app refuses to start (`ConfigurationError`) when `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` starts with a secret-token prefix (`shpat_`, `shpss_`, `shpca_`, `shppa_`); if that happens, revoke the exposed token in Shopify and use the public one.
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

- **Catalog:** `/products` lists the 20 products, kits first (`custom.position`), and the category chips show "Kits", "Herramientas", "Luz y energía"…
- **Kit pages:** `/products/kit-72h` shows the "Número de personas" chips ("1 persona", "2 personas", "4 personas"); picking one changes the price, and the cart line reads "Kit 72h · 2 personas". The long text comes from `custom.long_description`. The contents link to the loose products, which show "Incluido en el Kit 72h".
- **Home:** the header lists the kits, and the kit cards, comparison table and "Qué hay dentro" grid are filled.
- **Cart and checkout:** add to cart → **Finalizar compra** takes you to the Shopify checkout. Shipping options and prices there match the site's quotes (step 5).
- **Test order:** pay with the test card from Shopify Payments test mode (or the Bogus Gateway). The order appears in **Orders**, and the site's cart is empty on return.

If the app fails at startup with a configuration error, a required variable is missing or the token is a secret one (step 10). If products are missing, check the Headless channel publication (step 9). If details are missing or the order is wrong, check the metafield **Storefronts** access (step 8). If a product is missing and the server log says it is priced in another currency, check the Spain market's currency (step 3).

## 12. Deploy (Vercel)

In the Vercel project, set the same variables for **Production** and **Preview**, plus:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://bugout.es` (your production origin) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | the real support address (required by the LSSI) |
| `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_TAX_ID`, `NEXT_PUBLIC_LEGAL_ADDRESS` | the business identity (required by the LSSI) |
| `NEXT_PUBLIC_POSTHOG_KEY` | your PostHog project key, EU region (optional) |
| `SHOPIFY_WEBHOOK_SECRET` | Production only, server-only (never `NEXT_PUBLIC_`): the webhook signing key from Settings → Notifications → Webhooks |

For the test site (`test.bugout.es`, the `develop` branch), scope the Preview variables to `develop` and set `NEXT_PUBLIC_SITE_URL=https://test.bugout.es`, with a development store's domain and token rather than the live store's.

`NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them. The production Content-Security-Policy automatically allows your Shopify store domain for the browser's cart calls.

**Checkout domain (Settings → Domains):** connect a subdomain such as `checkout.bugout.es` to Shopify, so shoppers see your brand during checkout instead of `*.myshopify.com`.

## 13. Go-live checklist

- [ ] Plan chosen (the trial ends and real orders need a paid plan).
- [ ] Shopify Payments **test mode off**.
- [ ] Shipping rates in Shopify match `pricingPolicy.ts`, and Canarias/Ceuta/Melilla are excluded.
- [ ] Taxes: IVA included in prices.
- [ ] All products published to Headless, with photos, weights, stock and metafields; kits with their `Personas` variants and `custom.kit`, and every product with its `custom.position`.
- [ ] Compare-at prices comply with the 30-day lowest-price rule.
- [ ] Policies filled in Shopify and consistent with the site's legal pages (ideally reviewed by a lawyer).
- [ ] Vercel env vars set, including the site URL, contact email and legal identity.
- [ ] Order webhooks, `SHOPIFY_WEBHOOK_SECRET` and the custom pixel set up ([ANALYTICS.md](ANALYTICS.md#setup-outside-the-code-carlos)).
- [ ] One real order placed and refunded end to end; it shows up on the PostHog **Bugout · Sales** dashboard.

## 14. Pending code work for the Shopify phase

This doesn't block the setup above, but is the next development step:

- **Server-side token:** use the Headless channel's private token (`Shopify-Storefront-Private-Token` header, server-only env var) for Server Component catalog requests, and add `Shopify-Storefront-Buyer-IP` when a request comes from a real visitor.

## Hidden for now: features Shopify doesn't cover

- **Newsletter signup form:** Shopify's Storefront API only offers a newsletter-only signup in its `unstable` version. A stable integration needs the Admin API (a secret token, so server-side) or an email-marketing app such as Klaviyo or Brevo. Until then, newsletter consent is collected at Shopify's checkout (step 7).
- **Contact form:** Shopify has no contact-form API for headless storefronts. It needs an email provider or helpdesk.

Both forms are hidden while `getContainer().isMessagingSimulated()` is true. Customers are pointed to `NEXT_PUBLIC_CONTACT_EMAIL` instead. When real `NewsletterService` / `ContactService` adapters are connected and the flag returns false, the forms reappear.
