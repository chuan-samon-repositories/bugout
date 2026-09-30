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
    metaTitle: 'Kit 24h o Kit 72h: cómo elegir tu kit de emergencia',
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
    title: 'Prepárate',
    metaTitle: 'Cómo prepararse para una emergencia: guía y tarjetas de acción',
    description:
      'Qué hacer antes, durante y después de una emergencia, en pasos cortos y con la fuente oficial de cada consejo.',
    metaDescription:
      'Guía para prepararte ante apagones, inundaciones, incendios y otras emergencias: 5 pasos para empezar y tarjetas de acción paso a paso, con primeros auxilios basados en las guías ERC 2025.',
    startHere: {
      eyebrow: 'Empieza aquí',
      title: 'Si la emergencia es ahora',
      text: 'Si hay una vida en peligro, llama al 112. Después, sigue los pasos de los primeros 15 minutos.',
      cardCta: 'Ver los primeros 15 minutos',
    },
    emergencyNumbers: {
      title: 'Teléfonos de emergencia',
      items: [
        { number: '112', tel: '112', label: 'Emergencias', detail: 'Gratuito, las 24 horas.', source: 'gencat112' },
        {
          number: '91 562 04 20',
          tel: '+34915620420',
          label: 'Información Toxicológica',
          detail: 'Intoxicaciones, las 24 horas.',
          source: 'sitService',
        },
      ],
      /** Link text of each number's official source. */
      sourceLink: 'Fuente oficial',
    },
    why: {
      eyebrow: 'Por qué prepararse',
      title: 'Las emergencias más habituales no son de película',
      description:
        'Son apagones, temporales, inundaciones o evacuaciones cortas. Estar preparado reduce la incertidumbre de los primeros momentos.',
      items: [
        {
          title: 'Apagones',
          text: 'El 28 de abril de 2025 se cayó el sistema eléctrico de toda la España peninsular. Sin luz dejan de funcionar la nevera, la calefacción y, cuando se agota la batería, el móvil.',
          source: 'boeBlackout',
        },
        {
          title: 'Lluvias torrenciales e inundaciones',
          text: 'Las lluvias fuertes pueden cortar carreteras y suministros en poco tiempo, y obligar a quedarse en casa o a salir de ella con prisa.',
          source: 'gencatHeavyRain',
        },
        {
          title: '72 horas por tu cuenta',
          text: 'La Comisión Europea, en su Estrategia para una Unión de la Preparación de marzo de 2025, recomienda que la población pueda arreglárselas sola durante al menos 72 horas.',
          source: 'euPreparedness',
        },
      ],
    },
    steps: {
      eyebrow: 'Cómo prepararte',
      title: 'Prepárate en 5 pasos',
      description: 'No hace falta hacerlo todo el mismo día. Empieza por el primero.',
      items: [
        {
          title: 'Infórmate',
          text: 'Conoce los riesgos de tu zona y cómo te avisarán: las alertas ES-Alert llegan al móvil y AEMET publica los avisos por mal tiempo. Pregunta en tu ayuntamiento si tiene un plan de emergencias.',
          cards: ['CL-02'],
          source: 'proteccionCivilEsAlert',
        },
        {
          title: 'Haz tu plan familiar',
          text: 'Acordad un punto de encuentro, un contacto que viva fuera de vuestra zona y quién se ocupa de quién. Apuntadlo todo en la ficha familiar.',
          cards: ['CL-03', 'CL-10'],
          source: 'gencatFamilyPlan',
        },
        {
          title: 'Prepara tu kit',
          text: 'Ten a mano lo necesario para 72 horas: agua (al menos 2 litros por persona y día), comida que no necesite nevera, luz, radio, botiquín, documentos y medicación.',
          cards: ['CL-04', 'CL-08'],
          source: 'gencatKit',
          kitsLink: 'Ver los kits',
        },
        {
          title: 'Aprende primeros auxilios',
          text: 'Saber hacer RCP o parar una hemorragia salva vidas en los minutos que tarda en llegar la ayuda. Un curso presencial es la mejor forma de aprenderlo.',
          cards: ['PA-01', 'PA-04'],
          source: 'cruzRojaCourses',
        },
        {
          title: 'Revisa y practica',
          text: 'De vez en cuando, revisa las fechas del agua y de la comida y el estado de las pilas, y practica el plan con tu familia.',
          cards: ['PM-00'],
          source: 'gencatPrepare',
        },
      ],
      /** Before the step's card links. */
      cardsLabel: 'Tarjetas:',
      sourceLabel: 'Fuente:',
    },
    cards: {
      eyebrow: 'Qué hacer si…',
      title: 'Tarjetas de acción',
      description:
        'Cada tarjeta explica una situación en pasos cortos: qué hacer, qué no hacer y cuándo llamar al 112.',
      jumpLabel: 'Categorías de tarjetas',
      count: (count: number) => (count === 1 ? '1 tarjeta' : `${count} tarjetas`),
      extrasNote: 'Estas tarjetas solo están en la web: no van en la baraja de los kits.',
    },
    deck: {
      eyebrow: 'Las tarjetas de tu kit',
      title: 'La misma guía, en papel',
      description: 'Para cuando no haya cobertura ni batería.',
      /** One line per kit that carries a deck, e.g. "El Kit 24h incluye 29 tarjetas: …". */
      kitLine: (kit: string, count: number) => `El ${kit} incluye ${count} tarjetas`,
      editions: {
        essential: 'las esenciales para las primeras horas y para evacuar.',
        complete: 'todas las tarjetas principales, también para pasar varios días en casa.',
      },
      codeTitle: 'Cómo leer las tarjetas',
      codeText:
        'Cada categoría tiene un color, unas letras y una forma, para distinguirlas también sin ver bien los colores. El código de la esquina, por ejemplo PA-04, es el mismo en papel y en esta página.',
    },
    sources: {
      eyebrow: 'De dónde sale esta información',
      title: 'Fuentes oficiales',
      text: 'Hemos escrito las tarjetas con nuestras palabras a partir de las guías y recomendaciones de estas organizaciones. Cada tarjeta enlaza las páginas en las que se basa.',
      firstAid:
        'Los primeros auxilios siguen las Guías ERC 2025 del European Resuscitation Council, publicadas en octubre de 2025.',
      course: 'Estas tarjetas no sustituyen a un curso. Para aprender primeros auxilios con práctica,',
      courseLink: 'busca un curso de Cruz Roja',
      updated: (date: string) => `Contenido revisado el ${date}.`,
      reviewedBy: (reviewer: string) => `Revisión sanitaria: ${reviewer}.`,
    },
    disclaimer:
      'Información general basada en fuentes oficiales. No sustituye a un curso de primeros auxilios ni a la atención sanitaria. En una emergencia, llama al 112 y sigue siempre las instrucciones de las autoridades.',
    card: {
      whatToDo: 'Qué hacer',
      fields: 'Qué apuntar',
      dont: 'No hagas',
      call112: 'Llama al 112 si',
      callNow: 'Llamar al 112',
      why: 'Por qué',
      see: 'Ver',
      seeAlso: 'Ver también',
      sources: 'Fuentes',
      includedIn: 'Incluida en',
      /** Accessible name of a card's code badge, e.g. "Tarjeta PA-04, Primeros auxilios". */
      code: (code: string, category: string) => `Tarjeta ${code}, ${category}`,
      language: { en: '(en inglés)', ca: '(en catalán)' },
      allCards: 'Todas las tarjetas',
    },
    ctaTitle: 'Elige tu kit',
  },
  faqPage: {
    title: 'Preguntas frecuentes',
    metaTitle: 'Preguntas frecuentes sobre los kits de emergencia',
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
