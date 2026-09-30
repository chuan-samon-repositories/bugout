/** Copy for the catalog area (home page, catalog, product detail). */
export const catalog = {
  /** Spanish labels for known category slugs. Unknown slugs are humanised by `categoryLabel`. */
  categories: {
    kits: 'Kits',
    agua: 'Agua',
    comida: 'Comida',
    'luz-y-energia': 'Luz y energía',
    'primeros-auxilios': 'Primeros auxilios',
    'refugio-y-abrigo': 'Refugio y abrigo',
    herramientas: 'Herramientas',
    higiene: 'Higiene',
    general: 'Otros',
  } as Record<string, string>,

  /**
   * Search title (also the page heading), meta description and intro of each category page. Categories without
   * an entry use their label and the catalog's generic copy.
   */
  categoryPages: {
    kits: {
      title: 'Kits de emergencia 24h, 72h y a medida',
      description:
        'Kits de emergencia listos para usar: el Kit 72h, para ser autosuficiente tres días como recomienda la UE, el Kit 24h para el coche o la entrada de casa, y el Kit Custom a medida.',
      intro: 'Mochilas de emergencia preparadas para 24 o 72 horas, o una base para montar la tuya.',
    },
    agua: {
      title: 'Agua para emergencias',
      description: 'Cantimploras y equipo para llevar agua en tu mochila de emergencia o reponer la de tu kit.',
      intro: 'Para tener agua a mano en una evacuación o durante un corte de suministro.',
    },
    comida: {
      title: 'Comida de emergencia',
      description: 'Alimentos para tu kit de emergencia, con la fecha de caducidad indicada en cada envase.',
      intro: 'Para comer sin cocina ni nevera durante los primeros días de una emergencia.',
    },
    'luz-y-energia': {
      title: 'Luz y energía para apagones',
      description:
        'Linternas frontales, lámparas y radio solar para tener luz y seguir la información oficial durante un apagón.',
      intro: 'Para ver, orientarte y seguir la información oficial cuando se va la luz.',
    },
    'primeros-auxilios': {
      title: 'Botiquines de primeros auxilios',
      description: 'Botiquines compactos para curas básicas en las primeras horas de una emergencia.',
      intro: 'Para las curas básicas de las primeras horas, en casa o fuera.',
    },
    'refugio-y-abrigo': {
      title: 'Mantas y ponchos térmicos de emergencia',
      description: 'Mantas térmicas y ponchos de emergencia para conservar el calor y protegerte de la lluvia y el frío.',
      intro: 'Para conservar el calor y mantenerte seco si tienes que salir de casa.',
    },
    herramientas: {
      title: 'Herramientas y equipo de supervivencia',
      description: 'Mochilas, cuerda, hornillo, bolsas estancas y más equipo para completar tu kit de emergencia.',
      intro: 'El equipo que lleva cada kit, también por separado.',
    },
    higiene: {
      title: 'Higiene para tu kit de emergencia',
      description: 'Neceser y productos de higiene básicos para tu mochila de emergencia.',
      intro: 'Lo básico para la higiene diaria cuando no tienes tu baño a mano.',
    },
  } as Record<string, { title: string; description: string; intro: string }>,

  card: {
    outOfStock: 'Agotado',
  },

  list: {
    metaTitle: 'Kits y equipo de emergencia',
    saleMetaTitle: 'Ofertas en kits y equipo de emergencia',
    metaDescription:
      'Kit 24h, Kit 72h y Kit Custom, más el equipo de nuestros kits por separado: agua, luz y energía, primeros auxilios, refugio, herramientas e higiene.',
    description: 'El equipo de nuestros kits, también por separado.',
    title: 'Kits y equipo de emergencia',
    resultCount: (count: number, formatted: string) => `${formatted} ${count === 1 ? 'producto' : 'productos'}`,
    emptyTitle: 'No hay productos que coincidan con estos filtros',
    emptyDescription: 'Prueba a ampliar el rango de precios o a quitar alguno de los filtros.',
    unavailableTitle: 'Catálogo no disponible',
    loading: 'Cargando productos…',
  },

  filters: {
    title: 'Filtros',
    toggle: 'Más filtros',
    categoriesLabel: 'Categorías',
    categoryCount: (count: string) => `(${count})`,
    activeCount: (count: number) => (count === 1 ? '1 filtro activo' : `${count} filtros activos`),
    category: 'Categoría',
    allCategories: 'Todas',
    price: 'Precio',
    priceMin: 'Mínimo',
    priceMax: 'Máximo',
    priceRange: (min: string, max: string) => `Precios entre ${min} y ${max}`,
    priceSwapped: 'El mínimo es mayor que el máximo; mostramos los productos entre ambos valores.',
    availability: 'Disponibilidad',
    inStockOnly: 'Solo en stock',
    onSaleOnly: 'Solo ofertas',
    sort: 'Ordenar por',
    sortOptions: {
      featured: 'Destacados',
      'price-asc': 'Precio: de menor a mayor',
      'price-desc': 'Precio: de mayor a menor',
      rating: 'Mejor valorados',
      reviews: 'Más opiniones',
    },
    clear: 'Limpiar filtros',
  },

  product: {
    savings: (amount: string) => `Ahorras ${amount}`,
    inStock: 'En stock',
    outOfStock: 'Agotado',
    quantity: 'Cantidad',
    decrease: 'Reducir cantidad',
    increase: 'Aumentar cantidad',
    addToCart: 'Añadir al carrito',
    maxReached: 'Ya tienes el máximo de unidades en el carrito',
    inCart: (count: number) => (count === 1 ? 'Ya tienes 1 unidad en el carrito.' : `Ya tienes ${count} unidades en el carrito.`),
    maxHint: (max: number) => `Puedes añadir hasta ${max} ${max === 1 ? 'unidad' : 'unidades'} más.`,
    description: 'Descripción',
    features: 'Características',
    specifications: 'Especificaciones',
    contents: 'Contenido del kit',
    related: 'También te puede interesar',
    gallery: 'Imágenes del producto',
    showImage: (index: number) => `Ver imagen ${index}`,
    pauseGallery: 'Pausar el cambio automático de imágenes',
    playGallery: 'Reanudar el cambio automático de imágenes',
    brand: 'Bugout',
  },

  delivery: {
    title: 'Envío y devoluciones',
    standard: (price: string, min: number, max: number) =>
      min === max ? `Envío estándar: ${price}, entrega en ${min} ${min === 1 ? 'día laborable' : 'días laborables'}` : `Envío estándar: ${price}, entrega en ${min}–${max} días laborables`,
    freeFrom: (threshold: string) => `Envío estándar gratis en pedidos desde ${threshold}`,
    returns: (days: number) => `Tienes ${days} días para devolver tu pedido`,
    moreInfo: 'Más información sobre envíos y devoluciones',
  },

  /** Kit cards, comparison table, contents and the kit detail page. */
  kit: {
    from: 'Desde',
    fromPrice: (price: string) => `Desde ${price}`,
    view: 'Ver el kit',
    /** Starts with the visible text, so voice control users can say "Ver el kit". */
    viewLabel: (kit: string) => `Ver el kit: ${kit}`,
    /** A fact line on a kit card, e.g. "Peso: 1,8 kg". */
    fact: (label: string, value: string) => `${label}: ${value}`,
    people: 'Personas',
    peopleList: (values: string[]) =>
      values.length <= 1 ? values.join('') : `${values.slice(0, -1).join(', ')} o ${values[values.length - 1]}`,
    compareCaption: 'Comparativa de los kits',
    compareFeature: 'Característica',
    compareRows: {
      price: 'Precio (desde)',
      items: 'Número de artículos',
    },
    compareEmpty: '—',
    includedIn: (kit: string) => `Incluido en el ${kit}`,
    includedInLabel: 'Incluido en',
    variantLegend: (option: string) => `Número de ${option.toLowerCase()}`,
    variantUnit: (title: string) => title,
    specs: 'Ficha técnica',
    specsFor: 'Para',
    /** Caption of a multi-variant kit's spec table: the data describe its first (smallest) version. */
    specsForVariant: (variant: string) => `Ficha técnica de la versión para ${variant}`,
    contentsTitle: 'Contenido completo',
    contentsQuantityNote: 'Cantidades del kit para 1 persona; las versiones para más personas las multiplican.',
    contentsQuantity: (quantity: string) => `× ${quantity}`,
    /** Under the contents of a kit that carries the printed action-card deck. */
    actionCardsTitle: (count: number) => `Incluye ${count} tarjetas de acción`,
    actionCardsText: 'Qué hacer en cada emergencia, paso a paso y con fuentes oficiales. También puedes consultarlas aquí.',
    actionCardsLink: 'Ver las tarjetas',
    galleryContents: 'Lo que incluye el kit',
    crossSellTitle: 'Añade productos',
    crossSellDescription: 'Completa tu kit con material suelto del catálogo.',
    compareLink: 'Ver la comparativa de kits',
    /** Gallery label of a build-your-own kit, whose linked contents are the base backpacks to choose from. */
    galleryBases: 'Mochilas base',
    buildYourOwnCta: 'Montar mi kit',
    quickAdd: 'Añadir',
    quickAddLabel: (name: string) => `Añadir ${name} al carrito`,
  },

  /** The kit builder on a build-your-own kit's page (Kit Custom). */
  builder: {
    title: 'Monta tu kit',
    intro:
      'Elige la mochila y marca lo que necesitas. Cada producto va al carrito por separado, así pagas solo lo que te falta.',
    baseStep: 'Paso 1 · Elige la mochila',
    itemsStep: 'Paso 2 · Añade lo que necesites',
    itemsStepAlone: 'Añade lo que necesites',
    baseNone: 'Ya tengo mochila',
    baseNoneHint: 'Solo añadiremos los productos que elijas.',
    presetsLabel: '¿Prefieres partir de un kit?',
    preset: (kit: string) => `Partir del ${kit}`,
    presetApplied: (kit: string) =>
      `Hemos marcado el contenido del ${kit} (cantidades para 1 persona). Quita lo que ya tengas.`,
    presetUnavailable: (items: string) => `No se venden por separado o están agotados: ${items}.`,
    reset: 'Vaciar la selección',
    decrease: (name: string) => `Quitar una unidad de ${name}`,
    increase: (name: string) => `Añadir una unidad de ${name}`,
    quantityOf: (name: string) => `Unidades de ${name}:`,
    variant: (name: string) => `Versión de ${name}`,
    outOfStock: 'Agotado',
    summaryTitle: 'Tu kit',
    summaryEmpty: 'Todavía no has elegido nada.',
    summaryCount: (lines: number, units: number) =>
      `${lines === 1 ? '1 producto' : `${lines} productos`} · ${units === 1 ? '1 unidad' : `${units} unidades`}`,
    total: 'Total',
    add: 'Añadir al carrito',
    addHint: 'Elige al menos un producto para añadirlo al carrito.',
    added: (lines: number) =>
      lines === 1 ? 'Hemos añadido 1 producto al carrito.' : `Hemos añadido ${lines} productos al carrito.`,
    unavailable: 'Ahora mismo no podemos mostrar los productos. Vuelve a intentarlo en unos minutos.',
  },

  home: {
    /** The home page's <h1>, shown small above the slogan. */
    heroHeading: 'Kits de emergencia de 72 horas y mochilas de supervivencia',
    heroTitleLead: 'Porque una emergencia',
    heroTitleAccent: 'no avisa.',
    heroSubtitle:
      'Kit 24h, Kit 72h o monta tu propio kit. Equipamiento esencial para ti y tu familia, listo para salir por la puerta contigo.',
    heroFallbackCta: 'Ver los productos',
    heroScroll: 'Bajar a los kits',

    kitsEyebrow: 'Los kits',
    kitsTitle: 'Elige según el tiempo que necesites aguantar',
    kitsDescription: 'Consulta el contenido completo de cada uno antes de elegir.',

    compareEyebrow: '24h vs 72h',
    compareTitle: '¿Qué diferencias hay?',
    compareMore: 'Ver la comparativa completa y saber qué kit te conviene',

    insideEyebrow: 'Qué hay dentro',
    insideTitle: 'El contenido, desplegado',
    insideDescription: (kit: string) => `Contenido del ${kit}. Cada pieza está por un motivo.`,

    whyEyebrow: 'Por qué prepararse',
    whyTitle: 'Las emergencias no avisan',
    whyParagraphs: [
      'Un apagón, una inundación repentina o una evacuación temporal pueden pasar en cualquier zona y en cualquier momento. Tener un kit básico a mano no es alarmismo: es el mismo sentido común que tener un seguro o un extintor en casa.',
      'Las autoridades de protección civil recomiendan que cada hogar tenga a mano material básico de subsistencia y primeros auxilios para las primeras horas de una emergencia, antes de que llegue la ayuda.',
      'Para empezar, tienes una guía en 5 pasos y tarjetas de acción para cada emergencia, con la fuente oficial de cada consejo.',
    ],
    whyMore: 'Cómo prepararte',

    shopEyebrow: 'Productos sueltos',
    shopTitle: 'Completa o renueva tu kit',
    shopDescription: 'Repón lo que hayas usado o amplía tu kit pieza a pieza.',
    viewCatalog: 'Ver todo el catálogo',

    trustTitle: 'Comprar en Bugout',
    trustFreeShipping: (threshold: string) => `Envío gratis desde ${threshold}`,
    trustShippingPrice: (price: string) => `Envío estándar por ${price}`,
    trustDelivery: (min: number, max: number) =>
      min === max ? `Entrega en ${min} ${min === 1 ? 'día laborable' : 'días laborables'}` : `Entrega en ${min}–${max} días laborables`,
    trustRegionTitle: 'Península y Baleares',
    trustRegionText: 'Enviamos a toda la España peninsular y a las islas Baleares',
    trustExpiryTitle: 'Caducidad a la vista',
    trustExpiryText: 'El agua y los alimentos indican su fecha en cada envase',
    trustReturnsTitle: (days: number) => `${days} días para devolver`,
    trustReturnsText: 'Sin necesidad de indicar el motivo',

    newsletterTitle: 'Consejos de preparación en tu correo',
    newsletterText: 'Recibe guías prácticas para preparar tu kit, novedades del catálogo y ofertas.',
  },
} as const;
