import { formatList } from '@/presentation/i18n/format';

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
  howToChoose: {
    title: 'Cómo elegir tu kit',
    description:
      'El Kit 24h y el Kit 72h, comparados lado a lado, más el Kit Custom si prefieres montártelo a medida.',
    metaDescription: 'Compara el Kit 24h y el Kit 72h de Bugout y descubre cuál necesitas según tu situación.',
    compareTitle: 'Comparativa',
    forWhomTitle: 'Para quién es cada kit',
    kitsTitle: 'Los kits',
    emptyTitle: 'Estamos preparando los kits',
    emptyText: 'Todavía no hay kits a la venta. Mientras tanto, puedes ver el resto de productos del catálogo.',
    emptyCta: 'Ver los productos',
  },
  whyPrepare: {
    title: 'Por qué prepararse',
    description:
      'Las emergencias más habituales no son catástrofes de película: son cortes de luz, temporales, inundaciones locales o evacuaciones cortas. Un kit básico reduce la incertidumbre de los primeros momentos.',
    metaDescription:
      'Por qué vale la pena tener un kit de emergencia en casa: apagones, temporales e inundaciones, y qué recomiendan las autoridades.',
    sections: [
      {
        title: 'Apagones y cortes de suministro',
        paragraphs: [
          'Un corte de luz largo deja la casa sin iluminación ni calefacción, apaga la nevera y, cuando se agotan las baterías, también el móvil. El apagón del 28 de abril de 2025, que dejó sin electricidad durante horas a gran parte de la península ibérica, recordó lo rápido que puede pasar.',
          'Tener a mano una linterna o un frontal, una radio que no dependa de la red eléctrica, agua y algo de comida permite pasar esas horas con calma y seguir la información oficial.',
        ],
      },
      {
        title: 'Inundaciones y temporales',
        paragraphs: [
          'Las lluvias torrenciales y los temporales pueden cortar carreteras y suministros en muy poco tiempo, y obligar a quedarse en casa o a salir de ella con prisa.',
          'En esos momentos ayuda tener preparado lo esencial en una mochila: agua, abrigo, primeros auxilios, luz y los documentos importantes protegidos del agua.',
        ],
      },
      {
        title: 'Qué recomiendan las autoridades',
        paragraphs: [
          'La Comisión Europea, en su Estrategia para una Unión de la Preparación de marzo de 2025, anima a la población a tener lo necesario para ser autosuficiente durante al menos 72 horas en caso de emergencia.',
          'En España, Protección Civil publica recomendaciones para preparar un kit de emergencia y un plan familiar. Consúltalas en su web oficial antes de preparar el tuyo.',
        ],
        link: { label: 'Recomendaciones de Protección Civil', href: 'https://www.proteccioncivil.es' },
      },
    ],
    ctaTitle: 'Elige tu kit',
  },
  faqPage: {
    title: 'Preguntas frecuentes',
    description: 'Resolvemos las dudas más habituales sobre los kits, los productos y los pedidos.',
    kitsTitle: 'Sobre los kits',
    ordersTitle: 'Pedidos, envíos y devoluciones',
    differenceQuestion: '¿Qué diferencia hay entre los kits?',
    differenceLink: 'Ver la comparativa completa',
    peopleQuestion: '¿Puedo comprar un kit para toda la familia?',
    /** `kits` are the kit names: "Sí. El Kit 24h y el Kit 72h se venden para 1, 2 o 4 personas…" */
    peopleAnswer: (kits: readonly string[], people: string) => {
      const list = formatList(kits.map((kit) => `el ${kit}`));
      return `Sí. ${list.charAt(0).toUpperCase()}${list.slice(1)} ${kits.length === 1 ? 'se vende' : 'se venden'} para ${people} personas: elige el número de personas en la página de cada kit.`;
    },
    /** Term of a kit in the "¿Qué diferencia hay?" list, followed by its description. */
    differenceTerm: (kit: string) => `${kit}:`,
    customQuestion: '¿Puedo montar mi propio kit?',
    customAnswer: (kit: string) => `Sí, con el ${kit}: parte de una mochila base y añádele los productos sueltos que necesites.`,
    customLink: (kit: string) => `Ver el ${kit}`,
    looseQuestion: '¿Vendéis por separado lo que llevan los kits?',
    looseAnswer: 'Sí. El equipo de nuestros kits también se vende suelto, para completar un kit o reponer lo que hayas usado.',
    looseLink: 'Ver los productos sueltos',
    expiryQuestion: '¿Caducan los consumibles?',
    expiryAnswer:
      'El agua y los alimentos tienen su propia fecha de caducidad, indicada en cada envase. Revisa esas fechas de vez en cuando y renueva lo que esté a punto de caducar.',
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
          'Cada kit detalla su contenido pieza a pieza y todos los precios llevan el IVA incluido. Sabes exactamente lo que compras antes de comprarlo.',
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
          'El kit personalizable parte de una mochila base y se completa con los productos sueltos del catálogo que necesites según tu entorno y el tamaño de tu familia.',
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
