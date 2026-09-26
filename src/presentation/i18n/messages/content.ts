/** Date of the current version of every legal page (ISO calendar date). */
export const LEGAL_UPDATED_AT = '2026-09-26';

/** Statutory right of withdrawal for distance sales (RDL 1/2007, art. 104). */
export const LEGAL_WITHDRAWAL_DAYS = 14;

export type CookieCategory = 'necessary' | 'analytics';

export interface CookieItem {
  name: string;
  storage: string;
  provider: string;
  purpose: string;
  category: CookieCategory;
  duration: string;
}

const cookieItems: readonly CookieItem[] = [
  {
    name: 'bugout.cart',
    storage: 'localStorage',
    provider: 'Bugout (propio)',
    purpose: 'Guarda el contenido de tu carrito (solo identificadores de producto y cantidades).',
    category: 'necessary',
    duration: 'Hasta que vacíes el carrito o borres los datos del navegador',
  },
  {
    name: 'bugout.consent',
    storage: 'localStorage',
    provider: 'Bugout (propio)',
    purpose: 'Recuerda si has aceptado o rechazado las cookies de analítica y cuándo lo decidiste.',
    category: 'necessary',
    duration: 'Hasta que borres los datos del navegador o actualicemos esta política',
  },
  {
    name: 'bugout.shopify-cart-id',
    storage: 'localStorage',
    provider: 'Bugout (propio)',
    purpose: 'Identifica tu carrito en Shopify. Solo se usa cuando el pago se gestiona con Shopify.',
    category: 'necessary',
    duration: 'Hasta que finalices la compra o borres los datos del navegador',
  },
  {
    name: 'bugout.shopify-cart-rev',
    storage: 'localStorage',
    provider: 'Bugout (propio)',
    purpose:
      'Avisa a las demás pestañas abiertas de que tu carrito de Shopify ha cambiado para que lo actualicen. Solo se usa cuando el pago se gestiona con Shopify.',
    category: 'necessary',
    duration: 'Hasta que borres los datos del navegador',
  },
  {
    name: 'bugout.lastOrder',
    storage: 'sessionStorage',
    provider: 'Bugout (propio)',
    purpose: 'Conserva el resumen de tu último pedido para mostrar la página de confirmación.',
    category: 'necessary',
    duration: 'Hasta que cierres la pestaña del navegador',
  },
  {
    name: 'ph_<clave>_posthog',
    storage: 'Cookie y localStorage',
    provider: 'PostHog',
    purpose: 'Identificador seudónimo del visitante y de la sesión para elaborar estadísticas de uso.',
    category: 'analytics',
    duration: 'Cookie: 1 año. localStorage: hasta que borres los datos del navegador',
  },
  {
    name: '__ph_opt_in_out_<clave>',
    storage: 'localStorage',
    provider: 'PostHog',
    purpose: 'Registra en PostHog si la analítica está activada o desactivada según tu elección.',
    category: 'analytics',
    duration: 'Hasta que borres los datos del navegador',
  },
  {
    name: 'ph_<clave>_window_id, ph_<clave>_primary_window_exists',
    storage: 'sessionStorage',
    provider: 'PostHog',
    purpose: 'Distinguen las pestañas abiertas para agrupar correctamente las visitas de una sesión.',
    category: 'analytics',
    duration: 'Hasta que cierres la pestaña del navegador',
  },
];

/** Copy for the about page and the legal pages (privacy, cookies, terms, shipping and returns). */
export const content = {
  updatedAt: 'Última actualización:',
  pricingTable: {
    caption: 'Tarifas de envío (IVA incluido)',
    method: 'Modalidad',
    price: 'Precio',
    delivery: 'Plazo de entrega estimado',
    freeFrom: (amount: string) => `Gratis a partir de ${amount}`,
    deliveryDays: (min: number, max: number) =>
      min === max
        ? `${min} ${min === 1 ? 'día laborable' : 'días laborables'}`
        : `De ${min} a ${max} días laborables`,
    scrollHint: 'Tabla de tarifas de envío',
  },
  businessIdentity: {
    name: 'Titular',
    taxId: 'NIF',
    address: 'Domicilio',
    email: 'Correo electrónico',
  },
  manageCookies: 'Cambiar preferencias de cookies',
  /**
   * How customers reach the shop (ContactChannel): the configured email, else the contact form when messaging
   * is enabled, else a neutral link to the contact page.
   */
  contactChannel: {
    writeToEmail: 'escríbenos a',
    writeViaForm: 'escríbenos a través del',
    formLink: 'formulario de contacto',
    withTopic: (topic: string) => `con el tema «${topic}»`,
    visitPage: 'visita nuestra',
    pageLink: 'página de contacto',
  },
  cookieTable: {
    caption: 'Cookies y datos que guardamos en tu navegador',
    name: 'Nombre',
    storage: 'Dónde se guarda',
    provider: 'Titular',
    purpose: 'Finalidad',
    category: 'Tipo',
    duration: 'Duración',
    categories: {
      necessary: 'Necesaria',
      analytics: 'Analítica (requiere consentimiento)',
    } satisfies Record<CookieCategory, string>,
    scrollHint: 'Tabla de cookies',
    items: cookieItems,
  },
  about: {
    title: 'Sobre nosotros',
    description:
      'Creemos que estar preparado para una emergencia no debería ser cosa de expertos. Por eso diseñamos kits claros, completos y fáciles de usar.',
    storyTitle: 'Nuestra historia',
    story: [
      'Bugout nace de una idea sencilla: un apagón prolongado, una inundación o una evacuación imprevista pueden ocurrirle a cualquiera, y en esos momentos no hay tiempo para improvisar.',
      'Preparar un kit de emergencia desde cero exige saber qué incluir, en qué cantidad y cómo organizarlo. Muchas personas lo dejan para más adelante porque no saben por dónde empezar. Nosotros queremos que ese primer paso sea fácil.',
      'Por eso reunimos en una sola mochila lo esencial para las primeras horas de una emergencia, con una selección pensada para que cualquiera pueda utilizarla, tenga o no experiencia previa.',
    ],
    missionTitle: 'Nuestra misión',
    mission:
      'Ayudar a personas y familias a prepararse para una emergencia con equipamiento fiable, información clara y precios razonables, para que puedan protegerse y ayudar a quienes tienen cerca.',
    valuesTitle: 'Lo que nos importa',
    values: [
      {
        title: 'Preparación para todos',
        description:
          'Nuestros kits están pensados tanto para quien empieza como para quien ya tiene experiencia. Nada de jerga ni de equipamiento que no sabrías usar.',
      },
      {
        title: 'Transparencia',
        description:
          'Cada producto indica su contenido, sus especificaciones y su precio con IVA incluido. Sabes exactamente lo que compras antes de comprarlo.',
      },
      {
        title: 'Materiales duraderos',
        description:
          'Elegimos mochilas y componentes resistentes para que el kit siga listo cuando lo necesites, aunque pase meses guardado en un armario.',
      },
    ],
    /** Last value: its sentence names the contact channel (ContactChannel), so it is rendered separately. */
    supportValue: {
      title: 'Atención cercana',
      lead: 'Si tienes dudas sobre qué kit te conviene o necesitas ayuda con un pedido,',
      /** Only when a message really reaches someone (email configured or the form connected). */
      replyPromise: 'y te responderemos personalmente',
    },
    designTitle: 'Cómo diseñamos nuestros kits',
    designIntro:
      'Organizamos cada kit en torno a una pregunta: ¿qué necesitas para ser autosuficiente durante las primeras horas de una emergencia?',
    designPoints: [
      {
        title: 'Por duración',
        description:
          'La mochila de 24 horas cubre el primer día, el más crítico. La de 72 horas sigue la recomendación de las autoridades de protección civil de poder ser autosuficiente durante al menos tres días.',
      },
      {
        title: 'Por necesidades básicas',
        description:
          'Agua, alimentación, abrigo, primeros auxilios, luz, fuego y señalización: cada kit cubre estas necesidades con elementos que se complementan entre sí.',
      },
      {
        title: 'Modulares',
        description:
          'El kit personalizable parte de una base con lo imprescindible y se completa con nuestros accesorios de comida, agua y primeros auxilios según tu entorno y el tamaño de tu familia.',
      },
    ],
    ctaTitle: '¿Empezamos a preparar tu kit?',
    ctaText: 'Consulta el contenido de cada kit o escríbenos si no sabes cuál elegir.',
    /** When no contact channel exists yet (no email, contact form hidden): no invitation to write. */
    ctaTextWithoutChannel: 'Consulta el contenido de cada kit y elige el que mejor se adapta a ti.',
    ctaProducts: 'Ver productos',
    ctaContact: 'Contactar',
  },
  shipping: {
    title: 'Envíos y devoluciones',
    description: 'Tarifas, plazos de entrega y cómo devolver un pedido.',
  },
  terms: {
    title: 'Condiciones de venta',
    description: 'Condiciones generales que se aplican a las compras realizadas en esta tienda.',
  },
  privacy: {
    title: 'Política de privacidad',
    description: 'Qué datos personales tratamos, para qué y cómo puedes ejercer tus derechos.',
  },
  cookies: {
    title: 'Política de cookies',
    description: 'Qué guardamos en tu navegador y cómo puedes cambiar tu elección.',
  },
} as const;
