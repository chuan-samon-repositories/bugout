/** Copy shared across the whole storefront. */
export const common = {
  brand: 'BUGOUT',
  tagline: 'La revolución de las mochilas de supervivencia para todos los públicos',
  home: 'Inicio',
  products: 'Productos',
  loading: 'Cargando…',
  close: 'Cerrar',
  retry: 'Reintentar',
  requiredField: 'Obligatorio',
  optional: 'Opcional',
  breadcrumbs: 'Migas de pan',
  /** Spanish labels for known product badges (keys match `Product.badge`). */
  badges: {
    BESTSELLER: 'Más vendido',
    PREMIUM: 'Premium',
    SALE: 'Oferta',
  },
  price: {
    current: 'Precio actual',
    previous: 'Precio anterior',
    discount: (percent: number) => `${percent} % de descuento`,
  },
  rating: {
    /** Accessible summary, e.g. "Valoración 4,9 de 5 (1247 opiniones)". Values arrive pre-formatted. */
    label: (average: string, count: number, formattedCount: string) =>
      `Valoración ${average} de 5 (${formattedCount} ${count === 1 ? 'opinión' : 'opiniones'})`,
    count: (count: number, formattedCount: string) =>
      `${formattedCount} ${count === 1 ? 'opinión' : 'opiniones'}`,
  },
  notifications: {
    region: 'Notificaciones',
    dismiss: 'Cerrar notificación',
  },
} as const;
