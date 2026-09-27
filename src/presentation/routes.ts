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
  whyPrepare: '/why-prepare',
  faq: '/faq',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  cookies: '/cookies',
  terms: '/terms',
  shippingReturns: '/shipping-returns',
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
