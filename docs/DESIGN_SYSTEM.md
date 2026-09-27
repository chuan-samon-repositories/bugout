# Bugout design system

The storefront's look comes from a static prototype that a partner built in the repository `chuan-samon-repositories/bug-out` (HTML, `css/style.css`, vanilla JS). That design was ported onto this codebase in September 2026. **This repository is now the source of truth**: change the design here, not in the prototype.

The prototype's Catalan/English copy, language switcher, "TODO" placeholders and unverifiable claims (5-year warranty, "24–48h" delivery, "+40.000 kits", "4,9/5") were intentionally not ported. Only the Spanish copy was used, and only facts the code can back up.

## Visual language

- **Typeface:** Montserrat (400–900), loaded with `next/font/google` in `app/layout.tsx`. The variable sits on `<html>` because `--font-sans` is declared on `:root`. Headings are weight 800 with `-0.02em` tracking (`@layer base` in `globals.css`).
- **Surfaces:** a sand page (`bg-sand`) with white cards (`bg-white shadow-card`, `rounded-2xl`; kit cards are `rounded-kit`). Dark sections are navy: `navy` (tables, trust bar), `navy-deep` ("Qué hay dentro", consent banner) and `navy-darker` (hero, header, footer). Teasers use `bg-sand-dim`.
- **Buttons:** pills. The main call to action is `primary` (orange with navy text, lifted shadow `shadow-cta`). `secondary` is a navy outline. On dark backgrounds use `inverse` or `outline-inverse`.
- **Eyebrows:** small uppercase kickers above headings (`Eyebrow`, `SectionHeading`): `text-accent` on light backgrounds, `text-orange-on-navy` on dark ones.
- **Motion:** `ease-brand` (`cubic-bezier(.16,.84,.44,1)`), card hover lifts, scroll reveals (`Reveal`) and the breathing frog (`FrogMascot`). Everything is decorative and stops under `prefers-reduced-motion`.
- **Mascot and brand art** live in `public/images/brand/` (mark and wordmark, flat and stacked, in cream, navy and orange) and `public/images/mascot/` (`frog.png` and the 8-frame `frog-breathe-strip.png`). Use `brandAssets` (`presentation/config/brand.ts`) for their paths and sizes. The favicon (`app/icon.png`) is the orange mark (`mark-orange.png`, as in the prototype), padded into a transparent 512px square.
- **Product photos** are 900×900, shot on the brand navy, in `public/images/products/<slug>.jpg`. Product media areas are `bg-navy`, so a missing photo still looks intentional.

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
| `.nav`, `.nav.scrolled`, `.progress-bar` | `layout/Header.tsx`, `HeaderShell.tsx`, `BrandLogo.tsx` | `fixed`; transparent over the home hero until 40px of scroll (`data-transparent`), solid navy with blur elsewhere; `main` has `pt-(--header-height)` |
| `.nav__burger` dropdown | `layout/MobileMenu.tsx` | Dark `Drawer` with the nav and "Compra ahora" |
| `.lang-switch` | — | Not ported: the site is Spanish only |
| `.hero`, `.hero__frog`, `.hero__scroll` | `home/HomeHero.tsx`, `ui/FrogMascot.tsx` | Slides under the header with `-mt-(--header-height)` |
| `.kitcard-grid` / `.kitcard` | `kits/KitCard.tsx` (`KitCard`, `KitCardGrid`) | Label from `details.kit.label`, "Desde" from `priceRange()` |
| `.compare-table` | `kits/KitComparisonTable.tsx` | Rows from `compareKits()`; the home page omits the long expiry row |
| `.interior` + `.contents-grid` | `home/HomeKits.tsx` (`HomeInside`), `kits/KitContents.tsx` (`KitContentsGrid`) | The flagship kit (most contents) |
| `.why` | `home/WhyPrepareTeaser.tsx` | |
| `.shop-grid` / `.shop-card`, `.included-badge` | `catalog/ProductGrid.tsx`, `catalog/ProductCard.tsx`, `catalog/QuickAddButton.tsx` | Badges from `includedInIndex()`; quick add only for single-variant, in-stock products |
| `.trust` | `home/TrustBar.tsx` | Facts from the pricing policy and `siteConfig.returnWindowDays` only |
| `.page-hero` | `ui/PageHeader.tsx` (`tone="hero"`, the default) | Render it outside any `Container`; checkout uses `tone="plain"` |
| `.filter-bar` / `.filter-chip` | `catalog/CategoryChips.tsx` | Real links (`aria-current`) that filter in memory; price and availability sit in the "Más filtros" panel |
| `.kitpage` (gallery, `.variant-selector`, `.specs-table`, `.contents-list`, `.custom-explainer`) | `app/products/[slug]/page.tsx`, `kits/KitGallery.tsx`, `kits/PurchasePanel.tsx`, `kits/VariantSelector.tsx`, `kits/KitContents.tsx` (`KitContentsList`) | Variant chips are a native radio group |
| `com-triar/` | `app/how-to-choose/page.tsx` | "Para quién" from `details.kit.idealFor` |
| `per-que-preparar-se/` | `app/why-prepare/page.tsx` | Prose, no statistics; links the official Protección Civil site |
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

- `cn()` only joins classes and doesn't merge Tailwind conflicts. `className="hidden sm:inline-flex"` on a `ButtonLink` loses to its own `inline-flex`, so wrap the element instead (as the header CTA does).
- Custom CSS that utilities should be able to override (like `.frog-breathe`) must sit in `@layer components`, because unlayered CSS beats every Tailwind utility.
- Text next to a visually hidden span gets an extra space in the accessible name ("Ver el kit : Kit 72h"). Use an `aria-label` that starts with the visible text instead.
