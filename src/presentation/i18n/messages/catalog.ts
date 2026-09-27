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

  card: {
    outOfStock: 'Agotado',
  },

  list: {
    metaTitle: 'Productos',
    saleMetaTitle: 'Ofertas',
    metaDescription:
      'Kit 24h, Kit 72h y Kit Custom, más todo el material de nuestros kits por separado: agua, luz y energía, primeros auxilios, refugio, herramientas e higiene.',
    description: 'Todo el material de nuestros kits, disponible por separado.',
    title: 'Productos',
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
    contentsTitle: 'Contenido completo',
    contentsQuantityNote: 'Cantidades del kit para 1 persona; las versiones para más personas las multiplican.',
    contentsQuantity: (quantity: string) => `× ${quantity}`,
    galleryClosed: 'Foto del kit cerrado próximamente',
    galleryContents: 'Lo que incluye el kit',
    crossSellTitle: 'Añade productos',
    crossSellDescription: 'Completa tu kit con material suelto del catálogo.',
    compareLink: 'Ver la comparativa de kits',
    buildYourOwnTitle: '¿Cómo funciona el Kit Custom?',
    buildYourOwnText:
      'Elige la mochila base y añádele los productos sueltos que necesites del catálogo: cada uno se añade al carrito por separado, así pagas solo lo que te falta.',
    buildYourOwnCta: 'Ver los productos sueltos',
    quickAdd: 'Añadir',
    quickAddLabel: (name: string) => `Añadir ${name} al carrito`,
  },

  home: {
    heroEyebrow: 'Estar preparado no es opcional',
    heroTitleLead: 'Porque una emergencia',
    heroTitleAccent: 'no avisa.',
    heroSubtitle:
      'Kit 24h, Kit 72h o monta tu propio kit. Equipamiento esencial para ti y tu familia, listo para salir por la puerta contigo.',
    heroFallbackCta: 'Ver los productos',
    heroScroll: 'Bajar a los kits',

    kitsEyebrow: 'Los kits',
    kitsTitle: 'Elige según el tiempo que necesites aguantar',
    kitsDescription: 'Cada kit sale revisado pieza a pieza.',

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
    ],
    whyMore: 'Leer más',

    shopEyebrow: 'Productos sueltos',
    shopTitle: 'Completa o renueva tu kit',
    shopDescription: 'Sustituye un consumible caducado o amplía tu kit pieza a pieza.',
    viewCatalog: 'Ver todo el catálogo',

    trustTitle: 'Comprar en Bugout',
    trustFreeShipping: (threshold: string) => `Envío gratis desde ${threshold}`,
    trustShippingPrice: (price: string) => `Envío estándar por ${price}`,
    trustDelivery: (min: number, max: number) =>
      min === max ? `Entrega en ${min} ${min === 1 ? 'día laborable' : 'días laborables'}` : `Entrega en ${min}–${max} días laborables`,
    trustRegionTitle: 'Península y Baleares',
    trustRegionText: 'Enviamos a toda la España peninsular y a las islas Baleares',
    trustExpiryTitle: 'Control de caducidades',
    trustExpiryText: 'Te avisamos para renovar los consumibles',
    trustReturnsTitle: (days: number) => `${days} días para devolver`,
    trustReturnsText: 'Sin necesidad de indicar el motivo',

    newsletterTitle: 'Consejos de preparación en tu correo',
    newsletterText: 'Recibe guías prácticas para preparar tu kit, novedades del catálogo y ofertas.',
  },
} as const;
