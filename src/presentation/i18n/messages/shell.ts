/** Copy for the shell area: layout, header, footer, consent banner and error pages. */
export const shell = {
  metadata: {
    defaultTitle: 'Bugout — Mochilas y kits de supervivencia',
  },
  skipToContent: 'Saltar al contenido',
  logoLabel: 'Bugout, ir al inicio',
  nav: {
    primary: 'Principal',
    allProducts: 'Todos los productos',
    survivalKits: 'Kits de supervivencia',
    accessories: 'Accesorios',
    offers: 'Ofertas',
    about: 'Sobre nosotros',
    contact: 'Contacto',
  },
  menu: {
    open: 'Abrir menú',
    title: 'Menú',
  },
  cartButton: {
    label: 'Carrito',
    empty: 'Carrito vacío',
    withItems: (count: number, formattedCount: string) =>
      `Carrito, ${formattedCount} ${count === 1 ? 'artículo' : 'artículos'}`,
  },
  footer: {
    blurb:
      'Bugout prepara mochilas y kits de supervivencia listos para usar, para que cualquier persona pueda afrontar una emergencia con lo necesario a mano.',
    columns: {
      shop: 'Tienda',
      help: 'Ayuda',
      company: 'Empresa',
      legal: 'Legal',
    },
    shippingReturns: 'Envíos y devoluciones',
    privacy: 'Privacidad',
    cookies: 'Cookies',
    terms: 'Condiciones de venta',
    cookieSettings: 'Configurar cookies',
    newsletterTitle: 'Recibe novedades',
    newsletterText: 'Suscríbete para enterarte de los nuevos productos y ofertas de la tienda.',
    copyright: (year: number) => `© ${year} Bugout. Todos los derechos reservados.`,
  },
  consent: {
    region: 'Aviso de cookies',
    text:
      'Usamos el almacenamiento técnicamente necesario para guardar tu carrito. Solo si nos das permiso, usaremos también cookies de analítica (PostHog, con servidores en la UE) para mejorar la tienda.',
    policyLink: 'Más información sobre cookies',
    reject: 'Rechazar',
    accept: 'Aceptar',
  },
  notFound: {
    title: 'Página no encontrada',
    description: 'La página que buscas no existe o se ha movido.',
    home: 'Volver al inicio',
    products: 'Ver todos los productos',
  },
  error: {
    title: 'Algo ha salido mal',
    description: 'No hemos podido mostrar esta página. Vuelve a intentarlo en unos segundos.',
    retry: 'Reintentar',
    home: 'Volver al inicio',
  },
  globalError: {
    title: 'Algo ha salido mal',
    description: 'La tienda no se ha podido cargar. Vuelve a intentarlo en unos segundos.',
    retry: 'Reintentar',
  },
} as const;
