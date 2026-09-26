/** Copy for the catalog area (home page, catalog, product detail). */
export const catalog = {
  /** Spanish labels for known category slugs. Unknown slugs are humanised by `categoryLabel`. */
  categories: {
    'survival-kits': 'Kits de supervivencia',
    accessories: 'Accesorios',
    general: 'Otros',
  } as Record<string, string>,

  card: {
    outOfStock: 'Agotado',
  },

  list: {
    metaTitle: 'Productos',
    saleMetaTitle: 'Ofertas',
    metaDescription:
      'Mochilas y kits de supervivencia listos para usar, además de comida, agua y material de primeros auxilios para emergencias.',
    title: 'Productos',
    resultCount: (count: number, formatted: string) => `${formatted} ${count === 1 ? 'producto' : 'productos'}`,
    emptyTitle: 'No hay productos que coincidan con estos filtros',
    emptyDescription: 'Prueba a ampliar el rango de precios o a quitar alguno de los filtros.',
    unavailableTitle: 'Catálogo no disponible',
    loading: 'Cargando productos…',
  },

  filters: {
    title: 'Filtros',
    toggle: 'Filtros',
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

  home: {
    heroImageAlt: 'Dos excursionistas con mochila caminando por un sendero de montaña',
    heroEyebrow: 'Mochilas y kits de supervivencia',
    heroTitle: 'Prepárate para lo inesperado',
    heroSubtitle: (tagline: string) =>
      `${tagline}: kits completos y listos para usar, para que tú y los tuyos tengáis a mano lo esencial cuando más falta hace.`,
    heroPrimary: 'Ver nuestro kit más completo',
    heroSecondary: 'Ver todos los productos',
    heroTrust: (average: string, count: string) => `Valoración media de ${average} sobre 5 en ${count} opiniones de clientes`,

    valuePropsTitle: 'Por qué Bugout',
    readyTitle: 'Kits listos para usar',
    readyText: 'Cada mochila llega preparada con lo esencial. Solo tienes que dejarla a mano en casa, en el coche o en la oficina.',
    shippingTitle: (min: number, max: number) => (min === max ? `Entrega en ${min} ${min === 1 ? 'día laborable' : 'días laborables'}` : `Entrega en ${min}–${max} días laborables`),
    shippingTitleFallback: 'Envío a domicilio',
    shippingFree: (threshold: string) => `Envío estándar gratis en pedidos desde ${threshold}.`,
    shippingPaid: (price: string) => `Envío estándar por ${price}.`,
    returnsTitle: (days: number) => `${days} días para devolver tu pedido`,
    returnsText: (days: number) => `Si no te convence, tienes ${days} días para devolver tu pedido.`,

    featuredTitle: 'Productos destacados',
    featuredDescription: 'Nuestros kits más completos para empezar a prepararte.',
    viewCatalog: 'Ver todo el catálogo',

    kitTitle: (name: string) => `Qué incluye: ${name}`,
    kitLink: (name: string) => `Ver ${name}`,

    newsletterTitle: 'Consejos de preparación en tu correo',
    newsletterText: 'Recibe guías prácticas para preparar tu kit, novedades del catálogo y ofertas.',

    principlesTitle: 'Nuestros principios',
    principlesIntro: 'Lo que tenemos en cuenta al elegir cada artículo que vendemos.',
    principles: [
      {
        title: 'Preparación para todos los públicos',
        text: 'Kits pensados para que cualquier persona, tenga o no experiencia, sepa qué lleva y cómo usarlo.',
      },
      {
        title: 'Lo esencial, sin relleno',
        text: 'Elegimos cada artículo por su utilidad en una emergencia, no para alargar la lista de contenido.',
      },
      {
        title: 'Hecho para durar',
        text: 'Apostamos por materiales resistentes para que tu kit siga listo el día que lo necesites, aunque pasen años.',
      },
    ],
    missionTitle: 'Nuestra misión',
    missionText:
      'Ayudar a personas y familias a afrontar cualquier emergencia con tranquilidad y con las herramientas adecuadas. No se trata de vivir con miedo, sino de estar preparados para poder ayudarnos y ayudar a los demás.',
  },
} as const;
