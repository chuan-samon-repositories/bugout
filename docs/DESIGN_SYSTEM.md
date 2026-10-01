# Bugout design system

The storefront's look comes from a static prototype that a partner built in the repository `chuan-samon-repositories/bug-out` (HTML, `css/style.css`, vanilla JS). That design was ported onto this codebase in September 2026. **This repository is now the source of truth**: change the design here, not in the prototype.

The prototype's Catalan/English copy, language switcher, "TODO" placeholders and unverifiable claims (5-year warranty, "24–48h" delivery, "+40.000 kits", "4,9/5") were intentionally not ported. Only the Spanish copy was used, and only facts the code can back up.

## Visual language

- **Typeface:** Montserrat (400–900), self-hosted from `src/app/fonts/` (one variable Latin `woff2`, weights 100–900, OFL licence in `OFL.txt`) with `next/font/local` in `app/layout.tsx`, so builds never download it from Google. The variable sits on `<html>` because `--font-sans` is declared on `:root`. Headings are weight 800 with `-0.02em` tracking (`@layer base` in `globals.css`).
- **Surfaces:** a sand page (`bg-sand`) with white cards (`bg-white shadow-card`, `rounded-2xl`; kit cards are `rounded-kit`). Dark sections are navy: `navy` (tables, trust bar), `navy-deep` ("Qué hay dentro", consent banner) and `navy-darker` (hero, header, footer). Teasers use `bg-sand-dim`.
- **Action-card colours:** the `deck-*` tokens (`deck-pm` black, `deck-cl` violet, `deck-ev` blue, `deck-na` amber, `deck-te` red, `deck-pa` green, `deck-ad` teal) are the printed deck's category colours, following ISO 3864/7010 (green first aid, red fire, blue mandatory action). Use them only as badge and band backgrounds, with white text (ink on `deck-na`), through `deckColorClasses`/`deckBorderClasses` in `components/prepare/CardCodeBadge.tsx`, and always next to the category's letters and shape (`CardCodeBadge`, `CategoryShapeIcon`), so the code reads without colour.
- **Buttons:** pills. The main call to action is `primary` (orange with navy text, lifted shadow `shadow-cta`). `secondary` is a navy outline. On dark backgrounds use `inverse` or `outline-inverse`.
- **Eyebrows:** small uppercase kickers above headings (`Eyebrow`, `SectionHeading`): `text-accent` on light backgrounds, `text-orange-on-navy` on dark ones.
- **Motion:** `ease-brand` (`cubic-bezier(.16,.84,.44,1)`), card hover lifts, scroll reveals (`Reveal`), the kit card photos' swing (`KitPhotoSwing`), the product gallery's image change every 7 s (`ProductGallery`, which also has a pause button) and the breathing frog (`FrogMascot`, currently hidden). Everything is decorative and stops under `prefers-reduced-motion`.
- **The frog mascot is hidden.** It doesn't react to or guide the visitor, so it is decoration only. `isMascotEnabled()` (`presentation/config/mascot.ts`, `MASCOT_ENABLED = false`) gates it in the home hero, the "Por qué prepararse" teaser (a centred text column without it) and the 404 page. Set the flag to `true` to bring it back, ideally once it has a role. `mascot.test.tsx` covers both states.
- **Mascot and brand art** live in `public/images/brand/` (mark and wordmark, flat and stacked, in cream, navy and orange) and `public/images/mascot/` (`frog.png` and the 8-frame `frog-breathe-strip.png`). Use `brandAssets` (`presentation/config/brand.ts`) for their paths and sizes. The favicon (`app/icon.png`) is the orange mark (`mark-orange.png`, as in the prototype) on a 512px navy-deep rounded square: the mark is about 2.2:1, so on a transparent square it would fill under half of a 16px tab icon.
- **Product photos** are 900×900 JPGs in `public/images/products/<slug>.jpg`: the background-free product photos (the same as in Shopify) on white. Product media areas are `bg-navy`, so a missing photo still looks intentional. A kit without photos shows its label on a navy gradient (decorative, `aria-hidden`): `KitCard` headers cycle navy, orange and deep navy; `ProductCard` and the kit page use navy. The exceptions are the Kit 24h and Kit 72h cards, whose headers are white with a photo of their backpack (see below).
- **Kit card photos:** `KitCard` shows `kitCardPhoto(slug)` (`kits/kitCardPhotos.ts`), a cut-out photo of the backpack the kit comes in (a transparent WebP in `public/images/kit-cards/`), on white over a soft `navy-deep` floor shadow, with the kit label chip on top. Its bottom sits 148 px down the 160 px header and it is drawn taller than that, so it sticks out above the card. Its height follows the card width (`cqw`; the card is a size container), so it is as big as fits without growing wider than the card, up to a `maxHeight`; the Kit 72h's 65 L backpack is drawn about 1.1 times as tall as the Kit 24h's 30 L one, which is shown without its shoulder straps (the script keeps only what is inside its `body_outline`). Photo cards do not clip (only gradient cards keep `overflow-hidden`), and `KitCardGrid` leaves the room the photos rise into, in CSS. It is decorative (`alt=""`; the card names the kit). `KitPhotoSwing` swings it ±7° round its vertical axis every 12 s with WebGL and a depth relief baked by `scripts/kit-cards/build.py`, so the real photo turns with some volume; reduced motion and browsers without WebGL keep the still photo. To give another kit one, add its photo and calibration to the script, run it, and map the slug, `maxHeight` and `widthRatio` in `kitCardPhotos.ts`.

## Tokens (`src/app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `navy` / `navy-deep` / `navy-darker` | `#243c58` / `#172938` / `#0f1c27` | Dark surfaces; `navy-deep` is also the main text colour |
| `ink` | `#14212e` | Body text on white |
| `sand` / `sand-dim` / `sand-line` | `#eee8ce` / `#ddd6b8` / `#e4dcbc` | Page background, teaser bands, hairlines |
| `orange` / `orange-hover` / `orange-deep` | `#ff780c` / `#ff8a2b` / `#e0680a` | Buttons, chips, badges (with navy text) and gradients. Never text on light backgrounds |
| `orange-on-navy` | `#ff8a2b` | Orange text on navy |
| `accent` / `accent-hover` / `accent-soft` | `#8f3c00` / `#7d3400` / `#ffe8d4` | Orange-family text and links on light backgrounds; soft badge background |
| `muted` | `#4a586c` | Secondary text on white, sand and sand-dim |
| `danger` / `success` | `#a51f16` / `#176040` | Errors, stock state |

Plus `max-w-site` (1180px container), `rounded-kit` (28px), `shadow-card`, `shadow-lift`, `shadow-cta`, `shadow-float`, `ease-brand` and `--header-height` (4.5rem). `src/app/contrast.test.ts` checks every text/background pair the UI uses against WCAG AA: add a pair there when you introduce a new combination, and never raw hex in components.

## Where each prototype piece lives

| Prototype (`bug-out`) | React | Notes |
|---|---|---|
| `.nav`, `.nav.scrolled`, `.progress-bar` | `layout/Header.tsx`, `HeaderShell.tsx`, `BrandLogo.tsx` | `fixed`; transparent over the home hero until 40px of scroll (`data-transparent`), solid navy with blur elsewhere; `main` has `pt-(--header-height)`. The links (Kits, Productos, Prepárate; `PrimaryNav`) show from `xl` (1280px): below that they crowd the logo and cart. Kits, Productos and Prepárate open a navy dropdown (`bg-navy-darker`, `rounded-2xl`) on hover or with their chevron button, listing the kits, the product categories and the Prepárate links. Logo images are requested at their display size (`atWidth()` in `config/brand.ts`); only the mark is `priority` |
| `.nav__burger` dropdown | `layout/MobileMenu.tsx` | Dark `Drawer` with the nav (each section's kits or categories listed under it) and "Compra ahora", below `xl` |
| `.lang-switch` | — | Not ported: the site is Spanish only |
| `.hero`, `.hero__frog`, `.hero__scroll` | `home/HomeHero.tsx`, `ui/FrogMascot.tsx` | Slides under the header with `-mt-(--header-height)`; the frog renders only when `isMascotEnabled()` |
| `.kitcard-grid` / `.kitcard` | `kits/KitCard.tsx` (`KitCard`, `KitCardGrid`) | Label from `details.kit.label`, "Desde" from `priceRange()` |
| `.compare-table` | `kits/KitComparisonTable.tsx` | Rows from `compareKits()`; the home page omits the long expiry row. On phones cells tighten and wrap so two kits fit 360px; more kits scroll sideways in a focusable region |
| `.interior` + `.contents-grid` | `home/HomeKits.tsx` (`HomeInside`), `kits/KitContents.tsx` (`KitContentsGrid`) | The flagship kit (most contents) |
| `.why` | `home/WhyPrepareTeaser.tsx` | Frog column only when `isMascotEnabled()` |
| `.shop-grid` / `.shop-card`, `.included-badge` | `catalog/ProductGrid.tsx`, `catalog/ProductCard.tsx`, `catalog/QuickAddButton.tsx` | Badges from `includedInIndex()`; quick add only for single-variant, in-stock products that are not a build-your-own kit; "Desde" via `startingPriceLabel()` (several prices or a build-your-own base), as on `KitCard`; the price row wraps on narrow cards |
| `.trust` | `home/TrustBar.tsx` | Facts only: shipping from the pricing policy, the shipping region, the expiry date printed on each pack ("Caducidad a la vista", no reminder service) and `siteConfig.returnWindowDays` |
| `.page-hero` | `ui/PageHeader.tsx` (`tone="hero"`, the default) | Render it outside any `Container`; checkout uses `tone="plain"` |
| `.filter-bar` / `.filter-chip` | `catalog/CategoryChips.tsx` | Real links (`aria-current`) that filter in memory; price and availability sit in the "Más filtros" panel |
| `.kitpage` (gallery, `.variant-selector`, `.specs-table`, `.contents-list`, `.custom-explainer`) | `app/products/[slug]/page.tsx`, `kits/KitGallery.tsx`, `kits/PurchasePanel.tsx`, `kits/VariantSelector.tsx`, `kits/KitContents.tsx` (`KitContentsList`) | Variant chips are a native radio group |
| `com-triar/` | `app/how-to-choose/page.tsx` | "Para quién" from `details.kit.idealFor` |
| `per-que-preparar-se/` | `app/preparate/page.tsx`, `app/preparate/[slug]/page.tsx`, `components/prepare/` | Rebuilt as the action-card guide: navy "Empieza aquí" card with the emergency numbers, white cards for why prepare, the 5 steps (orange number bubbles) and the card index by category; card pages with a red "Llama al 112 si" box, large numbered steps, a red-bordered "No hagas" and the sources beside them. No statistics; every claim links its official source |
| `faq/` | `app/faq/page.tsx` | Kit answers derived from the catalog plus `ContactFaq` |
| `.simple-page` | `content/Prose.tsx`, `content/LegalPage.tsx` | Centred 760px column |
| `.footer` | `layout/Footer.tsx` | Newsletter band only while messaging is enabled |
| `.cart-toast` | — | Not ported: the cart drawer opening is the confirmation |
| `.reveal`, `.stagger` | `ui/Reveal.tsx` | Hides content only after mount, below the fold, with motion allowed |

## Adding a section

1. Put its copy in `presentation/i18n/messages/<area>.ts`.
2. Build it from the primitives: `Container` for width, `SectionHeading` (or `Eyebrow` + `h2`) for the head, white cards on light backgrounds, and `tone="dark"` variants on navy.
3. Label it: `<section aria-labelledby="…">` with the heading's `id`, and keep one `<h1>` per page.
4. Wrap it in `Reveal` only if motion adds something. Content must read fine without it.
5. If it uses a new colour pair, add the pair to `contrast.test.ts`.
6. Take screenshots at 1440px and on a Pixel 7 (Playwright) and compare them with the neighbouring sections.

## Pitfalls

- `cn()` only joins classes and doesn't merge Tailwind conflicts. `className="hidden sm:inline-flex"` on a `ButtonLink` loses to its own `inline-flex`, so wrap the element instead (as the header CTA does). For the same reason `NavLinkList` takes `idleClassName` / `currentClassName` instead of layering a current colour over a base one.
- Brand colours inside arbitrary gradients use the tokens too: gradient utilities with opacity (`bg-radial from-orange/12 to-transparent`) or `color-mix(in_srgb,var(--color-sand)_3.5%,transparent)`, never `rgb(...)` literals of a token.
- Custom CSS that utilities should be able to override (like `.frog-breathe`) must sit in `@layer components`, because unlayered CSS beats every Tailwind utility.
- Text next to a visually hidden span gets an extra space in the accessible name ("Ver el kit : Kit 72h"). Use an `aria-label` that starts with the visible text instead.
