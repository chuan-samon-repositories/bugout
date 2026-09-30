/** Copy for the shell area: layout, header, footer, consent banner and error pages. */
export const shell = {
  metadata: {
    /** Home page title, without the site-name suffix of the other pages. */
    defaultTitle: 'Kit de emergencia 72 horas y mochilas de supervivencia · Bugout',
    defaultDescription:
      'Kits de emergencia de 72 y 24 horas y mochilas de supervivencia. La UE recomienda poder ser autosuficiente al menos 72 horas en una emergencia. Envío a la península y Baleares.',
    /** The site's default share image (app/opengraph-image.tsx). */
    shareImageAlt: 'Bugout: kits de emergencia de 24 y 72 horas',
    shareTitle: 'Kits de emergencia de 24 y 72 horas',
    shareSubtitle: 'Mochilas de supervivencia listas para ti y tu familia.',
    /** Alt text of a product's generated share image. */
    productShareImageAlt: (name: string) => `${name} en Bugout`,
  },
  skipToContent: 'Saltar al contenido',
  logoLabel: 'Bugout, ir al inicio',
  nav: {
    primary: 'Principal',
    kits: 'Kits',
    products: 'Productos',
    /** Name of the button that opens a header dropdown, e.g. "Submenú de Kits". */
    submenu: (label: string) => `Submenú de ${label}`,
    about: 'Sobre nosotros',
    whyPrepare: 'Prepárate',
    /** "Prepárate" dropdown links to the page's sections. */
    prepareSteps: 'Cómo prepararte',
    prepareCards: 'Tarjetas de acción',
    prepareChecklist: 'Lista del kit de emergencia',
    /** Not "Primeros auxilios": that is also a product category in the Productos dropdown. */
    prepareFirstAid: 'Guía de primeros auxilios',
    contact: 'Contacto',
    /** Header call to action, linking to the flagship kit. */
    cta: 'Compra ahora',
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
    brandLabel: 'Bugout',
    blurb: 'Equipamiento de emergencia diseñado para aguantarlo todo.',
    closing: 'Hecho para quien no deja nada al azar.',
    columns: {
      shop: 'Tienda',
      company: 'Empresa',
      help: 'Ayuda',
      legal: 'Legal',
    },
    looseProducts: 'Productos sueltos',
    howToChoose: 'Cómo elegir tu kit',
    whyPrepare: 'Prepárate',
    faq: 'Preguntas frecuentes',
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
