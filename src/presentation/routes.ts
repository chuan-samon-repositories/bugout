/** Every in-app URL. Build links from here instead of hardcoding paths. */
export const routes = {
  home: '/',
  products: '/products',
  product: (slug: string) => `/products/${slug}`,
  /** Generated share image (Open Graph) of a product without photos, e.g. a kit. */
  productShareImage: (slug: string) => `/products/${slug}/share-image`,
  checkout: '/checkout',
  /** The site's default share image (Open Graph). */
  shareImage: '/share-image',
  howToChoose: '/how-to-choose',
  /** The Prepárate section (guide and action cards). The old English `/preparate` paths redirect here. */
  prepare: '/preparate',
  /** An action card's page (`/preparate/hemorragia-grave`); `/preparate/<code>` redirects to it. */
  actionCard: (slug: string) => `/preparate/${slug}`,
  /** The emergency kit checklist (a static segment, so it wins over the card pages' `[slug]`). */
  kitChecklist: '/preparate/lista-del-kit-de-emergencia',
  /** Generated share image (Open Graph) of an action card: its code, category and title. */
  actionCardShareImage: (slug: string) => `/preparate/${slug}/share-image`,
  /** A section of the Prepárate page (`prepareAnchors` or a card category's anchor). */
  prepareSection: (anchor: string) => `/preparate#${anchor}`,
  faq: '/faq',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  cookies: '/cookies',
  terms: '/terms',
  shippingReturns: '/shipping-returns',
} as const;

/** Ids of the Prepárate page's sections, for `routes.prepareSection`. */
export const prepareAnchors = {
  startHere: 'empieza-aqui',
  why: 'por-que-prepararse',
  steps: 'como-prepararte',
  cards: 'tarjetas',
  kitDeck: 'tarjetas-del-kit',
  sources: 'fuentes',
} as const;

/** Query-string keys understood by the catalog page (`/products?category=herramientas&sale=1`). */
export const catalogParams = {
  category: 'category',
  sort: 'sort',
  priceMin: 'min',
  priceMax: 'max',
  inStock: 'stock',
  onSale: 'sale',
} as const;

export function catalogUrl(params: Partial<Record<keyof typeof catalogParams, string>>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(catalogParams[key as keyof typeof catalogParams], value);
  }
  const query = search.toString();
  return query ? `${routes.products}?${query}` : routes.products;
}
