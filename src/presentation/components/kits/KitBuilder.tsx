"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { builderTotal, type BuilderLine, type BuilderPreset } from "@/application/catalog";
import { MAX_QUANTITY_PER_ITEM } from "@/domain/entities/cart/Cart";
import type { Product } from "@/domain/entities/product/Product";
import { getContainer } from "@/infrastructure/config";
import { FreeShippingProgress } from "@/presentation/components/cart/FreeShippingProgress";
import { categoryLabel } from "@/presentation/components/catalog/categoryLabel";
import { ProductImage } from "@/presentation/components/catalog/ProductImage";
import { fromProductSnapshot, type ProductSnapshot } from "@/presentation/components/catalog/productSnapshot";
import { Button, CartIcon, IconButton, MinusIcon, PlusIcon, PriceTag, cn, focusRing } from "@/presentation/components/ui";
import { useAnalytics } from "@/presentation/context/AnalyticsContext";
import { useCart } from "@/presentation/context/CartContext";
import { formatList, formatMoney, messages } from "@/presentation/i18n";

const copy = messages.catalog.builder;

/** Radio value of "Ya tengo mochila". */
const NO_BASE = "";

export interface KitBuilderGroup {
  category: string;
  products: ProductSnapshot[];
}

export interface KitBuilderProps {
  /** The build-your-own kit whose page this is. */
  kitSlug: string;
  /** Base backpacks to choose from (step 1); none skips the step. */
  bases: ProductSnapshot[];
  /** Loose products to add (step 2), by category. */
  groups: KitBuilderGroup[];
  /** "Partir del Kit 72h" selections. */
  presets: BuilderPreset[];
}

/**
 * The Kit Custom builder: pick a base backpack, add loose products with quantities (optionally
 * starting from a ready-made kit's contents), see the running total and free-shipping progress,
 * and put everything in the cart at once, each product as its own line.
 */
export function KitBuilder({ kitSlug, bases: baseSnapshots, groups: groupSnapshots, presets }: KitBuilderProps) {
  const { cart, addItems, pending } = useCart();
  const analytics = useAnalytics();
  const [policy] = useState(() => getContainer().getPricingPolicy());
  const id = useId();

  const bases = useMemo(() => baseSnapshots.map(fromProductSnapshot), [baseSnapshots]);
  const groups = useMemo(
    () => groupSnapshots.map((group) => ({ category: group.category, products: group.products.map(fromProductSnapshot) })),
    [groupSnapshots],
  );
  const items = useMemo(() => groups.flatMap((group) => group.products), [groups]);

  const [baseSlug, setBaseSlug] = useState(() => bases.find((base) => base.inStock)?.slug ?? NO_BASE);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  /** Chosen variant per product slug, for loose products sold in several versions. */
  const [variantIds, setVariantIds] = useState<Record<string, string>>({});
  const [preset, setPreset] = useState<BuilderPreset | null>(null);
  const [adding, setAdding] = useState(false);
  const [addedLines, setAddedLines] = useState<number | null>(null);

  const selected = (product: Product) => {
    const variantId = variantIds[product.slug];
    return variantId ? product.withVariant(variantId) : product;
  };
  /** Units that still fit in the cart line (at most 99 per product). */
  const room = (product: Product) => Math.max(0, MAX_QUANTITY_PER_ITEM - (cart?.quantityOf(product.id) ?? 0));

  const base = bases.find((candidate) => candidate.slug === baseSlug) ?? null;
  const lines: BuilderLine[] = [];
  if (base?.inStock && room(base) > 0) lines.push({ product: base, quantity: 1 });
  for (const item of items) {
    const product = selected(item);
    const quantity = Math.min(quantities[item.slug] ?? 0, room(product));
    if (product.inStock && quantity > 0) lines.push({ product, quantity });
  }
  const currency = policy.currency;
  const total = builderTotal(lines, currency);
  const units = lines.reduce((sum, line) => sum + line.quantity, 0);
  const cartSubtotal = cart && cart.currency === currency ? cart.totalAmount() : null;
  const empty = lines.length === 0;
  const hasSelection = Object.values(quantities).some((quantity) => quantity > 0);

  const changed = () => setAddedLines(null);
  const setQuantity = (slug: string, quantity: number) => {
    changed();
    setQuantities((current) => ({ ...current, [slug]: Math.max(0, Math.min(MAX_QUANTITY_PER_ITEM, quantity)) }));
  };
  const applyPreset = (next: BuilderPreset) => {
    changed();
    setQuantities({ ...next.quantities });
    if (next.baseSlug) setBaseSlug(next.baseSlug);
    setPreset(next);
  };
  const reset = () => {
    changed();
    setQuantities({});
    setPreset(null);
  };

  const add = async () => {
    if (empty || adding) return;
    setAdding(true);
    try {
      const result = await addItems(lines, "kit_builder");
      if (result.addedLines > 0 && result.cart) {
        analytics.track({
          name: "kit_builder_added_to_cart",
          properties: {
            cart_value: result.cart.totalAmount().amount,
            cart_item_count: result.cart.itemCount(),
            currency: result.cart.currency,
            kit_slug: kitSlug,
            line_count: result.addedLines,
            unit_count: result.addedUnits,
            base_slug: base?.slug ?? null,
            preset_slug: preset?.kitSlug ?? null,
          },
        });
        // Start over: the backpack is in the cart now, so adding more products must not add another one.
        setQuantities({});
        setPreset(null);
        setBaseSlug(NO_BASE);
        setAddedLines(result.addedLines);
      }
    } finally {
      setAdding(false);
    }
  };

  const itemsTitleId = `${id}-items`;
  const summaryTitleId = `${id}-summary`;
  const hintId = `${id}-hint`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-12">
        {bases.length > 0 && (
          <fieldset className="min-w-0">
            <legend className="mb-4">
              <h3 className="text-lg text-navy-deep">{copy.baseStep}</h3>
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {bases.map((candidate) => (
                <BaseOption
                  key={candidate.slug}
                  name={`${id}-base`}
                  value={candidate.slug}
                  checked={baseSlug === candidate.slug}
                  disabled={!candidate.inStock}
                  onSelect={() => {
                    changed();
                    setBaseSlug(candidate.slug);
                  }}
                >
                  <span aria-hidden="true" className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-navy">
                    <ProductImage product={candidate} sizes="64px" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-bold break-words text-navy-deep">{candidate.name}</span>
                    {candidate.inStock ? (
                      <PriceTag price={candidate.price} originalPrice={candidate.originalPrice} size="sm" />
                    ) : (
                      <span className="text-sm font-bold text-danger">{copy.outOfStock}</span>
                    )}
                  </span>
                </BaseOption>
              ))}
              <BaseOption
                className="sm:col-span-2"
                name={`${id}-base`}
                value={NO_BASE}
                checked={baseSlug === NO_BASE}
                onSelect={() => {
                  changed();
                  setBaseSlug(NO_BASE);
                }}
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-bold text-navy-deep">{copy.baseNone}</span>
                  <span className="text-sm text-muted">{copy.baseNoneHint}</span>
                </span>
              </BaseOption>
            </div>
          </fieldset>
        )}

        <section aria-labelledby={itemsTitleId} className="min-w-0">
          <h3 id={itemsTitleId} className="mb-4 text-lg text-navy-deep">
            {bases.length > 0 ? copy.itemsStep : copy.itemsStepAlone}
          </h3>

          {(presets.length > 0 || hasSelection) && (
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              {presets.length > 0 && <span className="text-sm font-semibold text-muted">{copy.presetsLabel}</span>}
              {presets.map((candidate) => (
                <Button
                  key={candidate.kitSlug}
                  size="sm"
                  variant="secondary"
                  aria-pressed={preset?.kitSlug === candidate.kitSlug}
                  onClick={() => applyPreset(candidate)}
                >
                  {copy.preset(candidate.kitName)}
                </Button>
              ))}
              {hasSelection && (
                <Button size="sm" variant="ghost" onClick={reset}>
                  {copy.reset}
                </Button>
              )}
            </div>
          )}

          <div aria-live="polite">
            {preset && (
              <div className="mb-6 rounded-xl bg-sand-dim px-4 py-3 text-sm text-navy-deep">
                <p>{copy.presetApplied(preset.kitName)}</p>
                {preset.unavailable.length > 0 && <p className="mt-1">{copy.presetUnavailable(formatList(preset.unavailable))}</p>}
              </div>
            )}
          </div>

          {groups.length === 0 ? (
            <p className="rounded-2xl bg-white p-5 text-muted shadow-card">{copy.unavailable}</p>
          ) : (
            <div className="flex flex-col gap-7">
              {groups.map((group) => (
                <section key={group.category} aria-labelledby={`${id}-${group.category}`}>
                  <h4
                    id={`${id}-${group.category}`}
                    className="mb-2 text-xs font-extrabold tracking-[0.08em] text-muted uppercase"
                  >
                    {categoryLabel(group.category)}
                  </h4>
                  <ul className="divide-y divide-sand-line rounded-2xl bg-white px-4 shadow-card">
                    {group.products.map((item) => {
                      const product = selected(item);
                      return (
                        <ItemRow
                          key={item.slug}
                          product={product}
                          base={item}
                          quantity={quantities[item.slug] ?? 0}
                          max={Math.min(MAX_QUANTITY_PER_ITEM, room(product))}
                          onQuantityChange={(quantity) => setQuantity(item.slug, quantity)}
                          onVariantChange={(variantId) => {
                            changed();
                            setVariantIds((current) => ({ ...current, [item.slug]: variantId }));
                          }}
                        />
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sticks to the bottom of the screen on phones (while the builder is in view) and beside the steps on desktop. */}
      <aside
        aria-labelledby={summaryTitleId}
        className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-lift sm:p-5 lg:top-[calc(var(--header-height)+1.5rem)] lg:bottom-auto lg:shadow-card"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 id={summaryTitleId} className="text-lg text-navy-deep">
              {copy.summaryTitle}
            </h3>
            <p className="text-sm text-muted">{empty ? copy.summaryEmpty : copy.summaryCount(lines.length, units)}</p>
          </div>
          <p aria-live="polite" aria-atomic="true" className="flex shrink-0 flex-col items-end">
            <span className="text-sm font-semibold text-muted">{copy.total}</span>
            <span className="text-2xl font-extrabold text-navy-deep tabular-nums">{formatMoney(total)}</span>
          </p>
        </div>
        {/* Phones keep the sticky bar short: the cart drawer shows free shipping and tax once the kit is added. */}
        {!empty && (
          <div className="hidden sm:block">
            <FreeShippingProgress subtotal={cartSubtotal ? total.add(cartSubtotal) : total} policy={policy} />
          </div>
        )}
        <p className="hidden text-xs text-muted sm:block">
          {policy.pricesIncludeTax ? messages.cart.taxIncluded : messages.cart.taxExcluded}
        </p>
        <div>
          <Button
            size="lg"
            fullWidth
            loading={adding}
            // The cart drawer opens while this is loading and returns focus here when it closes, so it
            // must stay focusable: an empty selection marks it aria-disabled instead of disabled.
            focusableWhileLoading
            disabled={pending && !adding}
            aria-describedby={hintId}
            {...(empty && !adding ? { "aria-disabled": true } : {})}
            onClick={add}
          >
            {!adding && <CartIcon />}
            {copy.add}
          </Button>
          {/* Always in the page (a live region must exist before it changes); takes no room while empty. */}
          <p
            id={hintId}
            aria-live="polite"
            className={cn("mt-2 text-sm empty:mt-0", addedLines ? "font-semibold text-success" : "text-muted")}
          >
            {addedLines ? copy.added(addedLines) : empty ? copy.addHint : ""}
          </p>
        </div>
      </aside>
    </div>
  );
}

interface BaseOptionProps {
  className?: string;
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: ReactNode;
}

/** A radio card: the whole card is the label, the native radio keeps keyboard and screen-reader behaviour. */
function BaseOption({ className, name, value, checked, disabled = false, onSelect, children }: BaseOptionProps) {
  return (
    <label
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-2xl border-2 bg-white p-3 shadow-card transition-colors",
        checked ? "border-accent" : "border-transparent",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-sand-line",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-2",
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="size-4 shrink-0 accent-accent focus-visible:outline-none"
      />
      {children}
    </label>
  );
}

interface ItemRowProps {
  /** The product with the chosen variant. */
  product: Product;
  /** The product as listed (its variants feed the version picker). */
  base: Product;
  quantity: number;
  max: number;
  onQuantityChange: (quantity: number) => void;
  onVariantChange: (variantId: string) => void;
}

function ItemRow({ product, base, quantity, max, onQuantityChange, onVariantChange }: ItemRowProps) {
  const name = product.displayName;
  const shown = Math.min(quantity, max);
  return (
    <li className="flex items-center gap-3 py-3">
      <div aria-hidden="true" className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-navy">
        <ProductImage product={product} sizes="56px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold break-words text-navy-deep">{product.name}</p>
        <PriceTag price={product.price} originalPrice={product.originalPrice} size="sm" />
        {base.hasVariants() && (
          <select
            aria-label={copy.variant(product.name)}
            value={product.id.value}
            onChange={(event) => onVariantChange(event.target.value)}
            className={cn("mt-1.5 block max-w-full rounded-lg border border-sand-line bg-white px-2 py-1 text-sm text-ink", focusRing)}
          >
            {base.variants.map((variant) => (
              <option key={variant.id.value} value={variant.id.value} disabled={!variant.inStock}>
                {variant.inStock ? variant.title : `${variant.title} (${copy.outOfStock})`}
              </option>
            ))}
          </select>
        )}
      </div>
      {product.inStock ? (
        <div
          className={cn(
            "flex shrink-0 items-center rounded-full border-[1.5px] bg-white",
            shown > 0 ? "border-accent" : "border-sand-line",
          )}
        >
          <IconButton label={copy.decrease(name)} onClick={() => onQuantityChange(shown - 1)} disabled={shown <= 0}>
            <MinusIcon className="size-4" />
          </IconButton>
          <span aria-live="polite" aria-atomic="true" className="min-w-8 text-center font-bold text-navy-deep tabular-nums">
            <span className="sr-only">{copy.quantityOf(name)} </span>
            {shown}
          </span>
          <IconButton label={copy.increase(name)} onClick={() => onQuantityChange(shown + 1)} disabled={shown >= max}>
            <PlusIcon className="size-4" />
          </IconButton>
        </div>
      ) : (
        <span className="shrink-0 text-sm font-bold text-danger">{copy.outOfStock}</span>
      )}
    </li>
  );
}
