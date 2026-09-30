import type { ActionCard } from './types';

/**
 * The "Tarjetas de acción" deck, in deck order: the same cards the Kit 24h and Kit 72h carry printed, and the
 * online-only extras (`extra`). Written in our own words from the sources each card cites (never copied from
 * the ERC or Cruz Roja): imperative verbs, one idea per step, numbers in digits. `essential` marks the Kit 24h
 * subset; every main card is in the Kit 72h deck. `cards.test.ts` checks the deck's structure.
 */
export const ACTION_CARDS: readonly ActionCard[] = [
  // PM · Primeros minutos
  {
    code: 'PM-00',
    slug: 'como-usar-las-tarjetas',
    category: 'pm',
    title: 'Cómo usar las tarjetas',
    metaTitle: 'Cómo usar las tarjetas de acción',
    summary: 'Encuentra en segundos la tarjeta de lo que está pasando y sigue sus pasos.',
    description:
      'Encuentra en segundos la tarjeta de cada emergencia por su color, sus letras y su forma, y sigue sus pasos. Si hay una vida en peligro, llama antes al 112.',
    steps: [
      { text: 'Busca la categoría de lo que pasa por su color, sus letras y su forma.' },
      { text: 'Saca la tarjeta de esa situación.' },
      { text: 'Haz los pasos en orden, de uno en uno.' },
      { text: 'Si una vida está en peligro, llama primero al 112.', see: ['CL-01'] },
    ],
    dont: [
      'No uses estas tarjetas en lugar de un curso de primeros auxilios.',
      'No hagas nada que contradiga las instrucciones de las autoridades o del 112.',
    ],
    context: [
      'Cada tarjeta tiene los pasos que hay que hacer, lo que no hay que hacer y cuándo llamar al 112. Cada color es una categoría, y cada categoría tiene también sus letras y su forma, para que se distingan sin depender del color.',
      'Léelas con calma antes de necesitarlas y practica el plan en familia: así, el día que haga falta, sabrás dónde mirar.',
    ],
    sources: ['gencatPrepare', 'proteccionCivilRecommendations'],
    essential: true,
  },
  {
    code: 'PM-01',
    slug: 'primeros-15-minutos',
    category: 'pm',
    title: 'Primeros 15 minutos',
    metaTitle: 'Primeros 15 minutos de una emergencia: qué hacer',
    summary: 'El orden para no olvidar nada al empezar cualquier emergencia.',
    description:
      'Qué hacer al empezar una emergencia: aléjate del peligro, llama al 112 si hay heridos, infórmate por canales oficiales y decide si confinarte o salir.',
    steps: [
      { text: 'Para, respira y aléjate del peligro inmediato.' },
      { text: 'Si alguien está herido grave, llama al 112.', see: ['PM-03'] },
      { text: 'Infórmate por canales oficiales: alertas en el móvil, radio y autoridades.', see: ['CL-02'] },
      { text: 'Decide si te quedas o te vas. Si dudas, quédate dentro.', see: ['PM-02'] },
      { text: 'Coge el kit, la documentación y la medicación.' },
      { text: 'Avisa a tu familia con un mensaje corto y ahorra batería.', see: ['CL-03'] },
    ],
    dont: [
      'No difundas rumores ni mensajes sin una fuente oficial.',
      'No llames al 112 para pedir información.',
      'No vayas a buscar a los niños al colegio si piden confinarse: allí los cuidan.',
    ],
    call112: 'una vida está en peligro, hay fuego o hay personas atrapadas.',
    context: [
      'En los primeros minutos se toman las decisiones más importantes. Esta tarjeta te da un orden para no olvidar nada.',
      'La Comisión Europea recomienda que cada hogar pueda arreglárselas solo durante al menos 72 horas.',
    ],
    productCategories: ['kits'],
    sources: ['gencatPrepare', 'gencatChemicalFaq', 'gencatNuclear', 'euPreparedness'],
    essential: true,
  },
  {
    code: 'PM-02',
    slug: 'confinarse-o-evacuar',
    category: 'pm',
    title: '¿Me quedo o me voy?',
    metaTitle: '¿Confinarse o evacuar? Cómo decidir',
    summary: 'Cuándo quedarse dentro y cuándo salir de casa.',
    description:
      'En una emergencia, la norma general es confinarse. Cuándo salir de casa, cuándo quedarse dentro y qué hacer en cada caso, según Protección Civil.',
    steps: [
      { text: 'La norma general es confinarse: entra en un edificio y cierra puertas y ventanas.' },
      { text: 'Sal solo si lo ordenan las autoridades o si tu casa no es segura: fuego dentro, olor a gas o agua que sube.' },
      { text: 'Si sales, sigue la tarjeta de evacuar.', see: ['EV-01'] },
      { text: 'Si te quedas, sigue la tarjeta de confinarse. En un accidente químico, usa la suya.', see: ['EV-02', 'TE-04'] },
    ],
    dont: ['No decidas por rumores.', 'No salgas a ver qué pasa.'],
    context: [
      'Protección Civil de Cataluña explica que la medida habitual es confinarse y que solo hay que marcharse cuando lo indican las autoridades. En caso de duda, confínate.',
    ],
    sources: ['gencatPrepare', 'gencatChemicalFaq'],
    essential: true,
  },
  {
    code: 'PM-03',
    slug: 'persona-herida',
    category: 'pm',
    title: 'Hay una persona herida',
    metaTitle: 'Persona herida: proteger, avisar y socorrer',
    summary: 'Proteger, avisar y socorrer: qué atender primero.',
    description:
      'Qué hacer si hay una persona herida: comprueba que es seguro, llama al 112 con el altavoz y atiende primero el sangrado fuerte y a quien no responde.',
    steps: [
      { text: 'Protege: comprueba que el lugar es seguro para ti y para la persona. Si no lo es, no entres.' },
      { text: 'Avisa: llama al 112 y pon el altavoz para tener las manos libres.', see: ['CL-01'] },
      { text: 'Socorre en este orden: sangrado fuerte, no responde, respira mal y, después, lo demás.', see: ['PA-04', 'PA-01'] },
      { text: 'No la muevas si no hay peligro.' },
      { text: 'Abrígala y quédate con ella hasta que llegue la ayuda.', see: ['CL-09'] },
    ],
    dont: [
      'No uses material que no sepas usar.',
      'No des de comer ni de beber a quien está medio inconsciente.',
    ],
    call112: 'la persona no responde, no respira con normalidad, sangra mucho o ha sufrido un golpe fuerte.',
    context: [
      'PAS son las iniciales de Proteger, Avisar y Socorrer, el esquema que enseña Cruz Roja para no perder la calma ante un accidente.',
    ],
    productCategories: ['primeros-auxilios'],
    sources: ['cruzRojaFirstAid', 'ercFirstAid'],
    essential: true,
  },

  // CL · Comunicación y logística
  {
    code: 'CL-01',
    slug: 'llamar-al-112',
    category: 'cl',
    title: 'Llamar al 112',
    metaTitle: 'Cómo llamar al 112 y qué decir',
    summary: 'Qué decir al 112 para que la ayuda llegue antes.',
    description:
      'El 112 es gratuito y atiende todas las emergencias. Qué decir para que la ayuda llegue antes: dónde estás, qué pasa, cuántas personas hay y cómo están.',
    steps: [
      { text: 'Marca 112. Es gratuito y atiende todas las emergencias.' },
      { text: 'Di dónde estás: calle, número, pueblo o un punto de referencia.' },
      { text: 'Di qué pasa.' },
      { text: 'Di cuántas personas hay y cómo están.' },
      { text: 'Responde a sus preguntas y no cuelgues hasta que te lo digan.' },
      { text: 'Después, deja el teléfono libre por si te llaman.' },
    ],
    dont: [
      'No cuelgues para volver a llamar.',
      'No habléis varias personas a la vez.',
      'No llames al 112 para pedir información general.',
    ],
    context: ['Si la situación cambia, por ejemplo, si la persona herida empeora, vuelve a llamar y explícalo.'],
    sources: ['euskadi112', 'gencat112', 'andalucia112'],
    essential: true,
  },
  {
    code: 'CL-02',
    slug: 'alertas-es-alert',
    category: 'cl',
    title: 'Alertas en el móvil (ES-Alert)',
    metaTitle: 'ES-Alert: qué hacer si recibes una alerta',
    summary: 'Qué hacer cuando el móvil suena con una alerta de Protección Civil.',
    description:
      'Qué hacer cuando el móvil suena con una alerta ES-Alert de Protección Civil: lee el mensaje entero, sigue sus instrucciones y confírmalo por canales oficiales.',
    steps: [
      { text: 'Si el móvil suena fuerte aunque esté en silencio, lee el mensaje entero.' },
      { text: 'Haz lo que diga el mensaje.' },
      { text: 'Confirma la información en la radio o en los canales oficiales.' },
      { text: 'Sigue atento por si llegan nuevos mensajes.' },
    ],
    dont: ['No cierres el aviso sin leerlo.', 'No reenvíes mensajes que no tengan una fuente oficial.'],
    context: [
      'ES-Alert es el sistema de avisos de Protección Civil. El mensaje llega a todos los móviles de la zona afectada a través de las antenas, sin registrarte y sin usar tu número de teléfono.',
    ],
    productCategories: ['luz-y-energia'],
    sources: ['proteccionCivilEsAlert'],
    essential: true,
  },
  {
    code: 'CL-03',
    slug: 'plan-familiar-sin-cobertura',
    category: 'cl',
    title: 'Sin cobertura: plan familiar',
    metaTitle: 'Plan familiar de emergencia sin cobertura',
    summary: 'Cómo reuniros y avisaros cuando no funcionan las llamadas.',
    description:
      'Cómo reuniros y avisaros cuando no funcionan las llamadas: un punto de encuentro, mensajes cortos, una hora fija para comunicaros y una nota en casa.',
    steps: [
      { text: 'Id al punto de encuentro que acordasteis.', see: ['CL-10'] },
      { text: 'Envía mensajes cortos en lugar de llamar.' },
      { text: 'Fija una hora para comunicaros, por ejemplo, a las horas en punto.' },
      { text: 'Deja una nota visible en casa: a dónde vas y a qué hora.' },
      { text: 'Infórmate con la radio de pilas.', see: ['CL-08'] },
    ],
    dont: ['No gastes batería probando llamadas una y otra vez.'],
    context: [
      'Un plan familiar sirve para cuando no podéis hablar: todos saben a dónde ir y cómo avisar. Incluye un contacto que viva fuera de tu zona, porque es más fácil que su teléfono funcione.',
    ],
    productCategories: ['luz-y-energia'],
    sources: ['gencatFamilyPlan', 'gencatPrepare'],
    essential: true,
  },
  {
    code: 'CL-04',
    slug: 'reserva-de-agua',
    category: 'cl',
    title: 'Agua: reserva y consumo',
    metaTitle: 'Cuánta agua guardar para una emergencia',
    summary: 'Cuánta agua guardar por persona y cómo repartirla.',
    description:
      'Guarda al menos 2 litros de agua por persona y día para beber, y agua aparte para cocinar y la higiene. Cómo calcular la reserva para 72 horas y repartirla.',
    steps: [
      { text: 'Guarda al menos 2 litros por persona y día para beber.' },
      { text: 'Guarda aparte agua para cocinar y para la higiene.' },
      { text: 'Bebe primero el agua de los envases abiertos.' },
      { text: 'Da prioridad a niños, personas mayores, enfermos y embarazadas.' },
      { text: 'Si avisan de un corte de agua, llena recipientes limpios.', see: ['TE-05'] },
    ],
    dont: ['No reduzcas el agua de beber cuando hace mucho calor.'],
    context: [
      'Protección Civil de Cataluña recomienda como mínimo 1,5 litros por persona y día para beber. Aquí proponemos 2 litros para tener margen, sobre todo con calor.',
      'Para las 72 horas que recomienda la Comisión Europea, 2 personas necesitan al menos 12 litros de agua de beber.',
    ],
    faq: [
      {
        question: '¿Cuánta agua necesito para 72 horas?',
        answer:
          'Al menos 2 litros por persona y día para beber: 6 litros por persona para 3 días, más el agua para cocinar y para la higiene.',
      },
      {
        question: '¿Cada cuánto hay que renovar el agua guardada?',
        answer:
          'Mira la fecha de consumo preferente de cada envase y cámbialo antes de que llegue. Revísalo de vez en cuando junto con el resto del kit.',
      },
    ],
    productCategories: ['agua'],
    sources: ['gencatKit', 'euPreparedness'],
    essential: false,
  },
  {
    code: 'CL-05',
    slug: 'potabilizar-agua',
    category: 'cl',
    title: 'Potabilizar agua',
    metaTitle: 'Cómo potabilizar agua: hervir o lejía apta',
    summary: 'Cómo hacer segura el agua cuando no sabes si es potable.',
    description:
      'Cómo hacer segura el agua en una emergencia: fíltrala si está turbia, hiérvela al menos 1 minuto o usa lejía apta para agua de bebida según su etiqueta.',
    steps: [
      { text: 'Si el agua está turbia, fíltrala con un paño limpio y déjala reposar.' },
      { text: 'Hiérvela al menos 1 minuto, con burbujas fuertes.' },
      { text: 'Si no puedes hervirla, usa lejía apta para la desinfección de agua de bebida y sigue su etiqueta.' },
      { text: 'Remueve y espera el tiempo que indique la etiqueta antes de beber.' },
    ],
    dont: [
      'No uses lejía con perfume o detergente, ni lejía que no diga «apta para agua de bebida».',
      'No mezcles la lejía con otros productos.',
      'No bebas ni te laves los dientes con agua de una inundación sin tratarla.',
    ],
    context: [
      'La cantidad de lejía depende de la concentración de cada marca. Por eso manda siempre la etiqueta de una lejía apta para la desinfección del agua de bebida.',
    ],
    faq: [
      {
        question: '¿Cuánto tiempo hay que hervir el agua?',
        answer:
          'Al menos 1 minuto desde que hierve con burbujas fuertes. Déjala enfriar antes de beber.',
      },
      {
        question: '¿Qué lejía puedo usar?',
        answer:
          'Solo la que dice en su etiqueta que es apta para la desinfección del agua de bebida, sin perfume ni detergente.',
      },
      {
        question: '¿Cuánta lejía hay que poner?',
        answer:
          'La que indique su etiqueta, porque depende de la concentración de cada lejía. No uses la dosis de otra marca.',
      },
    ],
    productCategories: ['agua'],
    sources: ['gvaFloodWater', 'sanidadDana'],
    essential: false,
  },
  {
    code: 'CL-06',
    slug: 'comida-sin-nevera',
    category: 'cl',
    title: 'Comida sin frío',
    metaTitle: 'Apagón: qué hacer con la comida de la nevera',
    summary: 'Qué comida guardar y cuál tirar cuando la nevera se queda sin luz.',
    description:
      'Si se va la luz, no abras la nevera: si el corte dura menos de 4 horas, la comida aguanta. Qué tirar después y cuánto aguanta el congelador cerrado.',
    steps: [
      { text: 'No abras la nevera ni el congelador.' },
      { text: 'Apunta la hora a la que empezó el corte.' },
      { text: 'Come primero lo que se estropea antes y deja las conservas para después.' },
      { text: 'Si la nevera lleva más de 4 horas sin luz, tira la carne, el pescado, los huevos, la leche, el queso fresco y las sobras.' },
      { text: 'El congelador cerrado aguanta unas 48 horas si está lleno y unas 24 si está medio lleno.' },
    ],
    dont: ['No pruebes la comida para saber si está buena. Si dudas, tírala.'],
    context: [
      'Según AESAN, si el corte dura menos de 4 horas y la nevera sigue cerrada, los alimentos se mantienen por debajo de 5 °C.',
    ],
    productCategories: ['comida'],
    sources: ['aesanFridge', 'acsaBlackout'],
    essential: false,
  },
  {
    code: 'CL-07',
    slug: 'higiene-sin-agua-corriente',
    category: 'cl',
    title: 'Higiene sin agua corriente',
    metaTitle: 'Higiene en una emergencia sin agua corriente',
    summary: 'Cómo mantener la higiene cuando no sale agua del grifo.',
    description:
      'Higiene sin agua corriente: lávate las manos, usa un cubo con bolsa doble para el váter, cierra bien la basura y limpia las superficies con lejía diluida.',
    steps: [
      { text: 'Lávate las manos antes de comer y después de ir al baño, con gel o con agua y jabón.' },
      { text: 'Si no hay agua para la cisterna, usa un cubo con una bolsa doble.' },
      { text: 'Cierra bien las bolsas de basura y sepáralas del resto.' },
      { text: 'Limpia las superficies con lejía diluida en agua.' },
    ],
    dont: ['No uses agua de una inundación para lavarte ni para cocinar.'],
    productCategories: ['higiene'],
    sources: ['gvaAfterFlood', 'sanidadDana', 'gencatKit'],
    essential: false,
  },
  {
    code: 'CL-08',
    slug: 'luz-radio-y-bateria',
    category: 'cl',
    title: 'Luz, radio y batería',
    metaTitle: 'Luz, radio y batería en un apagón',
    summary: 'Cómo tener luz e información el mayor tiempo posible.',
    description:
      'Cómo tener luz e información el mayor tiempo posible en un apagón: linterna en vez de velas, móvil en ahorro de energía y radio a las horas en punto.',
    steps: [
      { text: 'Usa linterna o frontal, no velas.' },
      { text: 'Pon el móvil en ahorro de energía y baja el brillo.' },
      { text: 'Usa la batería externa solo para comunicarte.' },
      { text: 'Escucha la radio a las horas en punto para ahorrar pilas.' },
      { text: 'Guarda las pilas de repuesto en un lugar seco.' },
    ],
    dont: ['No dejes velas encendidas sin vigilar ni cerca de niños.'],
    context: [
      'Protección Civil de Cataluña incluye en su kit de emergencia una linterna, una radio de pilas o de manivela, pilas de repuesto y una batería externa.',
    ],
    productCategories: ['luz-y-energia'],
    sources: ['gencatKit'],
    essential: true,
  },
  {
    code: 'CL-09',
    slug: 'manta-termica',
    category: 'cl',
    title: 'Manta térmica',
    metaTitle: 'Cómo usar una manta térmica',
    summary: 'Cómo usar la manta térmica para no perder calor.',
    description:
      'Cómo usar la manta térmica para no perder calor: quita la ropa mojada, aísla a la persona del suelo, cúbrele también la cabeza y protégela del viento.',
    steps: [
      { text: 'Si la persona lleva ropa mojada, quítasela y ponle ropa seca.', see: ['PA-09'] },
      { text: 'Aíslala del suelo con algo seco debajo.' },
      { text: 'Envuélvela con la manta, también la cabeza, y deja la cara libre.' },
      { text: 'Protégela del viento.' },
      { text: 'Mira en el envase de tu manta qué cara va hacia la persona: depende del fabricante.' },
    ],
    dont: ['No pongas la manta sobre ropa mojada.'],
    context: [
      'La manta térmica ayuda a no perder calor y protege del viento y de la lluvia. Funciona mejor si la persona está seca y aislada del suelo.',
    ],
    productCategories: ['refugio-y-abrigo'],
    sources: ['ercFirstAid'],
    essential: true,
  },
  {
    code: 'CL-10',
    slug: 'ficha-familiar',
    category: 'cl',
    title: 'Ficha familiar',
    metaTitle: 'Ficha familiar de emergencia: qué apuntar',
    summary: 'Los datos de tu familia que conviene tener en papel, sin depender del móvil.',
    description:
      'Qué datos de tu familia conviene tener en papel para una emergencia: teléfonos, un contacto fuera de tu zona, puntos de encuentro, alergias y medicación.',
    steps: [],
    fields: [
      'El nombre de cada persona de la casa.',
      'Teléfonos de contacto, incluido el de alguien que viva fuera de tu zona.',
      'Punto de encuentro 1, cerca de casa, y punto de encuentro 2, fuera del barrio.',
      'Alergias.',
      'Medicación y dosis.',
      'Enfermedades importantes.',
      'Grupo sanguíneo (si quieres).',
      'Veterinario y datos de tus mascotas.',
      'Número de póliza del seguro del hogar.',
    ],
    dont: ['No la guardes solo en el móvil: tenla también en papel, dentro del kit.'],
    context: [
      'Guarda también en el móvil un contacto de emergencia con un nombre fácil de encontrar, por ejemplo «AA SOS», para que los servicios de emergencia sepan a quién avisar.',
    ],
    sources: ['gencatFamilyPlan'],
    essential: true,
  },

  // EV · Evacuación y confinamiento
  {
    code: 'EV-01',
    slug: 'evacuar-la-vivienda',
    category: 'ev',
    title: 'Evacuar la vivienda',
    metaTitle: 'Cómo evacuar tu casa en una emergencia',
    summary: 'Qué coger y cómo salir cuando hay que dejar la casa.',
    description:
      'Qué coger y cómo salir cuando hay que dejar la casa: kit, documentos y medicación. Cierra gas, agua y luz si da tiempo y sigue la ruta oficial.',
    steps: [
      { text: 'Coge el kit, la documentación, la medicación y el móvil.' },
      { text: 'Si da tiempo, cierra el gas, el agua y la luz.' },
      { text: 'Cierra puertas y ventanas.' },
      { text: 'Baja por la escalera.' },
      { text: 'Sigue la ruta que indiquen las autoridades.' },
      { text: 'Ve al punto de encuentro o al centro de acogida que te indiquen.' },
    ],
    dont: [
      'No uses el ascensor.',
      'No vuelvas a buscar cosas.',
      'No tomes atajos que no indiquen las autoridades.',
    ],
    context: ['Ten la mochila cerca de la puerta de casa, para cogerla en segundos.'],
    productCategories: ['kits'],
    sources: ['cv112Floods', 'gencatPrepare', 'proteccionCivilRecommendations'],
    essential: true,
  },
  {
    code: 'EV-02',
    slug: 'confinarse-en-casa',
    category: 'ev',
    title: 'Confinarse en casa',
    metaTitle: 'Cómo confinarse en casa en una emergencia',
    summary: 'Cómo protegerte dentro de un edificio hasta que pase el peligro.',
    description:
      'Cómo protegerte dentro de un edificio hasta que pase el peligro: cierra puertas y ventanas, infórmate por la radio y sal solo cuando lo digan las autoridades.',
    steps: [
      { text: 'Entra en el edificio más cercano.' },
      { text: 'Cierra puertas y ventanas.' },
      { text: 'Infórmate por la radio o el móvil.', see: ['CL-02'] },
      { text: 'Ten a mano la linterna, el agua y la medicación.' },
      { text: 'Sal solo cuando lo digan las autoridades.' },
    ],
    dont: [
      'No vayas a buscar a nadie, tampoco a los niños al colegio.',
      'No uses el teléfono si no es necesario: deja las líneas libres.',
    ],
    context: ['En un accidente químico hay que hacer algo más: sellar una habitación interior.'],
    productCategories: ['luz-y-energia'],
    sources: ['gencatPrepare', 'gencatChemical', 'gencatNuclear'],
    essential: true,
  },
  {
    code: 'EV-03',
    slug: 'atrapado-en-el-coche',
    category: 'ev',
    title: 'Atrapado en el coche',
    metaTitle: 'Atrapado en el coche por nieve o agua',
    summary: 'Qué hacer si te quedas atrapado en el coche por la nieve, el agua o un atasco.',
    description:
      'Qué hacer si te quedas atrapado en el coche: si entra agua, sal y sube a un sitio alto; con nieve, quédate dentro con el escape libre y llama al 112.',
    steps: [
      { text: 'Si entra agua o la corriente mueve el coche, sal y sube a un sitio alto.', see: ['NA-02'] },
      { text: 'Si estás parado por la nieve o en un atasco largo, quédate dentro con las luces de emergencia puestas.' },
      { text: 'Mantén el motor y la calefacción en marcha, con el tubo de escape libre de nieve.' },
      { text: 'Abre un poco la ventanilla de vez en cuando para renovar el aire.' },
      { text: 'Abrígate con la manta térmica.', see: ['CL-09'] },
      { text: 'Llama al 112 y di dónde estás.', see: ['CL-01'] },
    ],
    dont: ['No cruces tramos inundados.', 'No intentes salvar el coche.'],
    context: ['Antes de salir con mal tiempo, llena el depósito y lleva manta, agua y el móvil cargado.'],
    productCategories: ['refugio-y-abrigo'],
    sources: ['dgtRoadEmergencies', 'gencatSnow', 'cv112Floods'],
    essential: true,
  },
  {
    code: 'EV-04',
    slug: 'volver-a-casa',
    category: 'ev',
    title: 'Volver a casa',
    metaTitle: 'Volver a casa tras una emergencia',
    summary: 'Qué revisar antes de volver a vivir en casa tras una emergencia.',
    description:
      'Qué revisar antes de volver a casa tras una emergencia: espera la autorización, no entres si huele a gas, revisa grietas y cables y haz fotos para el seguro.',
    steps: [
      { text: 'Vuelve solo cuando lo autoricen las autoridades.' },
      { text: 'Si huele a gas, no entres.', see: ['TE-02'] },
      { text: 'Revisa si hay grietas, cables sueltos o agua.' },
      { text: 'Haz fotos de los daños para el seguro.' },
      { text: 'Tira la comida que haya tocado el agua de una inundación.', see: ['NA-08'] },
    ],
    dont: ['No conectes la luz si la instalación se ha mojado.'],
    sources: ['gvaAfterFlood', 'cv112Floods', 'gencatPrepare'],
    essential: false,
  },

  // NA · Fenómenos naturales
  {
    code: 'NA-01',
    slug: 'lluvias-torrenciales-dana',
    category: 'na',
    title: 'Lluvias torrenciales o DANA: en casa',
    metaTitle: 'DANA y lluvias torrenciales: qué hacer en casa',
    summary: 'Cómo protegerte en casa cuando llueve con fuerza y puede haber inundaciones.',
    description:
      'Qué hacer en casa ante una DANA o lluvias torrenciales: sigue los avisos de AEMET, sube a los pisos altos, no bajes al garaje y desconecta la luz si entra agua.',
    steps: [
      { text: 'Sigue los avisos de AEMET y de Protección Civil.', see: ['CL-02'] },
      { text: 'Sube a los pisos altos. No bajes a sótanos ni garajes.' },
      { text: 'Pon los documentos y las medicinas arriba, en bolsas herméticas.' },
      { text: 'Si entra agua, desconecta la luz.' },
      { text: 'Cierra puertas y ventanas.' },
    ],
    dont: [
      'No bajes al garaje a sacar el coche.',
      'No te quedes en una planta baja si sube el agua.',
    ],
    call112: 'el agua entra rápido o hay personas atrapadas.',
    faq: [
      {
        question: '¿Por qué no hay que bajar al garaje a por el coche?',
        answer:
          'Los sótanos y los garajes se inundan antes que el resto de la casa y puedes quedarte atrapado. Protección Civil pide quedarse en las zonas altas.',
      },
      {
        question: '¿Dónde veo los avisos por lluvias?',
        answer:
          'AEMET publica en su web los avisos por mal tiempo, con colores según el riesgo. Si hay peligro, Protección Civil puede enviar además una alerta ES-Alert a los móviles de la zona.',
      },
      {
        question: '¿Qué hago si el agua ya entra en casa?',
        answer:
          'Desconecta la luz, sube a los pisos altos con los documentos y las medicinas y llama al 112 si el agua sube rápido o hay personas atrapadas.',
      },
    ],
    productCategories: ['herramientas'],
    sources: ['gencatHeavyRain', 'cv112Floods', 'aemetWarnings', 'proteccionCivilFloods', 'proteccionCivilEsAlert'],
    essential: true,
  },
  {
    code: 'NA-02',
    slug: 'inundacion-en-la-calle',
    category: 'na',
    title: 'Inundación: en la calle o en el coche',
    metaTitle: 'Inundación en la calle o en el coche',
    summary: 'Cómo ponerte a salvo si el agua te pilla fuera de casa.',
    description:
      'Cómo ponerte a salvo si una inundación te pilla fuera de casa: sube a un lugar alto, no cruces zonas con agua y aléjate de ríos, ramblas y barrancos.',
    steps: [
      { text: 'Sube a un lugar alto.' },
      { text: 'No cruces zonas con agua, ni a pie ni en coche.' },
      { text: 'Aléjate de ríos, ramblas y barrancos.' },
      { text: 'Si el coche empieza a flotar, sal y sube a un sitio alto.' },
      { text: 'Llama al 112.', see: ['CL-01'] },
    ],
    dont: [
      'No te quedes sobre puentes ni cerca de cauces.',
      'No aparques en ramblas.',
      'No intentes salvar el coche.',
    ],
    context: [
      'Bajo el agua no se ve lo que hay: alcantarillas abiertas, corrientes o cables. El agua en movimiento puede arrastrar a personas y coches.',
    ],
    sources: ['cv112Floods', 'gencatHeavyRain', 'dgtRoadEmergencies'],
    essential: true,
  },
  {
    code: 'NA-03',
    slug: 'incendio-forestal',
    category: 'na',
    title: 'Incendio forestal cerca',
    metaTitle: 'Incendio forestal cerca: qué hacer',
    summary: 'Qué hacer si hay un incendio forestal cerca de donde estás.',
    description:
      'Incendio forestal cerca: llama al 112, haz lo que digan las autoridades, tapa las rendijas si te quedas en casa y protégete del humo con un paño húmedo.',
    steps: [
      { text: 'Llama al 112 y di dónde está el fuego.', see: ['CL-01'] },
      { text: 'Haz lo que digan las autoridades: confinarte o evacuar.', see: ['PM-02'] },
      { text: 'Si te quedas en casa, cierra puertas y ventanas, baja las persianas y tapa las rendijas con trapos mojados.' },
      { text: 'Si estás al aire libre, ve a una zona despejada o ya quemada, lejos de barrancos y laderas.' },
      { text: 'Tápate la nariz y la boca con un paño húmedo.' },
    ],
    dont: [
      'No te acerques a mirar.',
      'No salgas por caminos que no indiquen las autoridades.',
      'No vuelvas hasta que lo permitan.',
    ],
    faq: [
      {
        question: '¿Me quedo en casa o me voy?',
        answer:
          'Haz lo que digan las autoridades: te dirán si debes confinarte o salir, y por qué ruta. No te marches por caminos que no indiquen.',
      },
      {
        question: '¿Cómo me protejo del humo?',
        answer:
          'Cierra puertas y ventanas, baja las persianas, tapa las rendijas con trapos mojados y cúbrete la nariz y la boca con un paño húmedo.',
      },
    ],
    sources: ['gencatForestFire'],
    essential: true,
  },
  {
    code: 'NA-04',
    slug: 'ola-de-calor',
    category: 'na',
    title: 'Ola de calor',
    metaTitle: 'Ola de calor: cómo protegerte',
    summary: 'Cómo pasar los días de mucho calor sin riesgos.',
    description:
      'Cómo pasar una ola de calor sin riesgos: bebe agua aunque no tengas sed, busca sitios frescos, evita el esfuerzo en las horas centrales y vigila a los mayores.',
    steps: [
      { text: 'Bebe agua aunque no tengas sed.' },
      { text: 'Quédate en las zonas más frescas de casa y pasa al menos 2 horas al día en un lugar con aire acondicionado.' },
      { text: 'Evita el esfuerzo en las horas centrales del día.' },
      { text: 'Llama o visita a las personas mayores que vivan solas.' },
      { text: 'Si alguien está confuso y muy caliente, trátalo como un golpe de calor.', see: ['PA-10'] },
    ],
    dont: ['No dejes a nadie dentro de un coche cerrado.', 'No bebas alcohol.'],
    context: [
      'Tienen más riesgo las personas mayores, las embarazadas, los niños pequeños, las personas con enfermedades crónicas y quienes trabajan al aire libre.',
      'Guarda las medicinas en un sitio fresco.',
    ],
    faq: [
      {
        question: '¿Quién tiene más riesgo con el calor?',
        answer:
          'Las personas mayores, las embarazadas, los niños pequeños, las personas con enfermedades crónicas y quienes trabajan al aire libre.',
      },
      {
        question: '¿Cómo sé si alguien tiene un golpe de calor?',
        answer:
          'Si tiene la piel muy caliente, está confuso o convulsiona, puede ser un golpe de calor: es una urgencia. Llama al 112 y enfríale enseguida.',
      },
      {
        question: '¿Dónde guardo las medicinas cuando hace mucho calor?',
        answer:
          'En un sitio fresco y seco, dentro de su envase, y nunca al sol ni dentro del coche.',
      },
    ],
    productCategories: ['agua'],
    sources: ['sanidadHeat', 'gencatHeat', 'aempsMedicinesHeat'],
    essential: false,
  },
  {
    code: 'NA-05',
    slug: 'ola-de-frio-y-nevada',
    category: 'na',
    title: 'Ola de frío y nevada',
    metaTitle: 'Ola de frío y nevadas: qué hacer',
    summary: 'Cómo protegerte del frío y de quedarte aislado por la nieve.',
    description:
      'Cómo protegerte del frío y de quedarte aislado por la nieve: cierra las habitaciones que no uses, abrígate por capas y calienta la casa sin riesgo de monóxido.',
    steps: [
      { text: 'Quédate en casa y cierra las habitaciones que no uses.' },
      { text: 'Ponte varias capas de ropa y cúbrete la cabeza.' },
      { text: 'Calienta la casa sin llama o con ventilación.', see: ['TE-06'] },
      { text: 'Si tienes que salir en coche, lleva manta y agua, y sal con el depósito lleno.', see: ['EV-03'] },
      { text: 'Vigila a las personas mayores y a los bebés.' },
    ],
    dont: ['No uses braseros, estufas de gas ni generadores en espacios cerrados sin ventilación.'],
    context: [
      'La Comunidad de Madrid recomienda poder vivir en casa durante 2 semanas si una nevada te deja aislado.',
    ],
    productCategories: ['refugio-y-abrigo'],
    sources: ['sanidadCold', 'gencatSnow', 'madridAdverseWeather'],
    essential: false,
  },
  {
    code: 'NA-06',
    slug: 'terremoto',
    category: 'na',
    title: 'Terremoto',
    metaTitle: 'Terremoto: qué hacer durante y después',
    summary: 'Cómo protegerte mientras tiembla y qué hacer después.',
    description:
      'Qué hacer en un terremoto: agáchate, cúbrete la cabeza bajo una mesa resistente y agárrate hasta que pare. Después, mira si hay heridos y si huele a gas.',
    steps: [
      { text: 'Agáchate.' },
      { text: 'Cúbrete la cabeza y el cuello bajo una mesa resistente o junto a una pared interior, lejos de las ventanas.' },
      { text: 'Agárrate hasta que pare el temblor.' },
      { text: 'Después, ponte zapatos, mira si hay heridos y comprueba si huele a gas.', see: ['PM-03', 'TE-02'] },
      { text: 'Sal por la escalera y espera réplicas.' },
    ],
    dont: ['No salgas corriendo mientras tiembla.', 'No uses el ascensor.'],
    faq: [
      {
        question: '¿Salgo a la calle mientras tiembla?',
        answer:
          'No. Protégete donde estás hasta que pare: bajo una mesa resistente o junto a una pared interior, lejos de las ventanas.',
      },
      {
        question: '¿Qué hago cuando para?',
        answer:
          'Ponte zapatos, mira si hay heridos y si huele a gas, y sal por la escalera, nunca en ascensor. Puede haber réplicas.',
      },
    ],
    productCategories: ['kits'],
    sources: ['gencatEarthquake', 'ignEarthquake'],
    essential: true,
  },
  {
    code: 'NA-07',
    slug: 'viento-y-tormenta-electrica',
    category: 'na',
    title: 'Temporal de viento y tormenta eléctrica',
    metaTitle: 'Viento fuerte y tormenta eléctrica: qué hacer',
    summary: 'Cómo protegerte del viento fuerte y de los rayos.',
    description:
      'Cómo protegerte de un temporal de viento o una tormenta eléctrica: sujeta los objetos del balcón, aléjate de ventanas y fachadas y no te refugies bajo un árbol.',
    steps: [
      { text: 'Recoge o sujeta macetas, toldos y objetos del balcón.' },
      { text: 'Quédate dentro y lejos de las ventanas.' },
      { text: 'En la calle, aléjate de fachadas, árboles, andamios y cables.' },
      { text: 'Si hay rayos, no te refugies bajo un árbol aislado y sal del agua.' },
      { text: 'Aléjate también de antenas y objetos de metal.' },
    ],
    dont: ['No subas a andamios ni a tejados.'],
    sources: ['gencatWind', 'gencatStorms'],
    essential: false,
  },
  {
    code: 'NA-08',
    slug: 'despues-de-una-inundacion',
    category: 'na',
    title: 'Después de la inundación',
    metaTitle: 'Después de una inundación: qué hacer',
    summary: 'Cómo limpiar y qué tirar cuando baja el agua.',
    description:
      'Qué hacer cuando baja el agua: usa guantes y botas, no enciendas la luz si la instalación se ha mojado, tira la comida mojada y potabiliza el agua.',
    steps: [
      { text: 'No toques el agua estancada ni el barro sin guantes ni botas.' },
      { text: 'No enciendas la luz si hay agua en la instalación.' },
      { text: 'Tira la comida que haya tocado el agua.' },
      { text: 'Hierve o potabiliza el agua hasta que las autoridades digan que es segura.', see: ['CL-05'] },
      { text: 'Ventila, retira el barro y desinfecta con lejía.' },
    ],
    dont: ['No uses aparatos que se hayan mojado.'],
    productCategories: ['higiene'],
    sources: ['gvaAfterFlood', 'gvaFloodWater', 'sanidadDana'],
    essential: false,
  },

  // TE · Incidentes en casa y tecnológicos
  {
    code: 'TE-01',
    slug: 'apagon-prolongado',
    category: 'te',
    title: 'Apagón prolongado',
    metaTitle: 'Qué hacer en un apagón largo',
    summary: 'Qué hacer cuando se va la luz durante horas.',
    description:
      'Qué hacer cuando se va la luz durante horas: comprueba el diferencial, enciende una radio de pilas, no abras la nevera, usa linterna y ten dinero en efectivo.',
    steps: [
      { text: 'Mira si el corte es solo en tu casa (el diferencial) o en toda la zona.' },
      { text: 'Desenchufa los aparatos delicados y deja una luz encendida para saber cuándo vuelve.' },
      { text: 'Enciende la radio de pilas.', see: ['CL-08'] },
      { text: 'No abras la nevera.', see: ['CL-06'] },
      { text: 'Usa linterna, no velas.' },
      { text: 'Ten dinero en efectivo: los pagos con tarjeta pueden fallar.' },
    ],
    dont: [
      'No llames al 112 para preguntar qué pasa.',
      'No uses generadores ni barbacoas dentro de casa.',
      'No cojas el coche si no hace falta: los semáforos pueden no funcionar.',
    ],
    call112: 'alguien está atrapado, un equipo médico se queda sin batería o hay un incendio.',
    context: [
      'El 28 de abril de 2025 se cayó el sistema eléctrico de toda la España peninsular, y el Gobierno declaró la emergencia de interés nacional en varias comunidades.',
    ],
    faq: [
      {
        question: '¿Cuánto aguanta la comida de la nevera sin luz?',
        answer:
          'Si el corte dura menos de 4 horas y no abres la nevera, los alimentos se mantienen por debajo de 5 °C, según AESAN. Un congelador lleno y cerrado aguanta unas 48 horas, y unas 24 si está medio lleno.',
      },
      {
        question: '¿Puedo usar un generador o una barbacoa dentro de casa?',
        answer:
          'No. Producen monóxido de carbono, un gas que no huele ni se ve y que puede intoxicar a toda la familia. Úsalos solo al aire libre.',
      },
      {
        question: '¿Llamo al 112 para saber qué pasa?',
        answer:
          'No. El 112 es solo para emergencias. Para saber qué pasa, escucha una radio de pilas o sigue los canales oficiales.',
      },
    ],
    productCategories: ['luz-y-energia'],
    sources: ['boeBlackout', 'aesanFridge', 'gencatPrepare', 'acsaBlackout', 'gencatCarbonMonoxide'],
    essential: true,
  },
  {
    code: 'TE-02',
    slug: 'fuga-de-gas',
    category: 'te',
    title: 'Fuga de gas',
    metaTitle: 'Fuga de gas en casa: qué hacer',
    summary: 'Qué hacer si huele a gas.',
    description:
      'Si huele a gas: no toques los interruptores, cierra la llave general, abre puertas y ventanas y sal de casa. Llama al 112 o a urgencias del gas desde fuera.',
    steps: [
      { text: 'No toques los interruptores: ni para encender ni para apagar.' },
      { text: 'Cierra la llave general del gas.' },
      { text: 'Abre puertas y ventanas.' },
      { text: 'Sal de casa.' },
      { text: 'Llama al 112 o al servicio de urgencias del gas desde fuera.' },
    ],
    dont: [
      'No enciendas llamas ni mecheros.',
      'No toques el timbre.',
      'No uses el móvil dentro de casa.',
    ],
    faq: [
      {
        question: '¿Por qué no hay que tocar los interruptores?',
        answer:
          'Porque al encender o apagar puede saltar una chispa, y una chispa o una llama pueden hacer explotar el gas acumulado.',
      },
      {
        question: '¿A quién llamo?',
        answer:
          'Desde fuera de casa, al 112 o al teléfono de urgencias de tu compañía del gas.',
      },
      {
        question: '¿Cuándo puedo volver a entrar?',
        answer:
          'Cuando los servicios de emergencia o un técnico del gas te digan que es seguro.',
      },
    ],
    sources: ['madridGas', 'gencatHomeSafety'],
    essential: true,
  },
  {
    code: 'TE-03',
    slug: 'incendio-en-casa',
    category: 'te',
    title: 'Incendio en casa o en el edificio',
    metaTitle: 'Incendio en casa o en el edificio: qué hacer',
    summary: 'Cómo salir a salvo si hay fuego en casa o en el edificio.',
    description:
      'Fuego en casa o en el edificio: sal y cierra la puerta, avanza agachado si hay humo, toca las puertas antes de abrirlas y llama al 112 desde fuera.',
    steps: [
      { text: 'Sal enseguida y cierra la puerta al salir.' },
      { text: 'Si hay humo, avanza agachado.' },
      { text: 'Antes de abrir una puerta, tócala. Si está caliente, no la abras.' },
      { text: 'Llama al 112 desde fuera.', see: ['CL-01'] },
      { text: 'Si no puedes salir, cierra las puertas, tapa las rendijas con trapos mojados y ponte en una ventana donde te vean.' },
    ],
    dont: [
      'No uses el ascensor.',
      'No vuelvas a entrar.',
      'No subas a la azotea si puedes bajar.',
    ],
    sources: ['gencatHouseFire', 'madridHouseFire'],
    essential: true,
  },
  {
    code: 'TE-04',
    slug: 'accidente-quimico',
    category: 'te',
    title: 'Accidente químico o nube tóxica',
    metaTitle: 'Accidente químico o nube tóxica: qué hacer',
    summary: 'Cómo protegerte si hay un escape químico o suena la sirena de alerta.',
    description:
      'Cómo confinarse ante un escape químico o si suena la sirena de alerta: entra en un edificio, cierra, apaga la ventilación y sella una habitación interior.',
    steps: [
      { text: 'Entra en el edificio más cercano.' },
      { text: 'Cierra puertas y ventanas y baja las persianas.' },
      { text: 'Apaga el aire acondicionado, la calefacción y los extractores.' },
      { text: 'Ve a una habitación interior y tapa las rendijas con toallas mojadas o con cinta.' },
      { text: 'Escucha la radio y sal solo cuando lo digan las autoridades.', see: ['CL-02'] },
    ],
    dont: [
      'No vayas a buscar a los niños al colegio: allí tienen un plan y los cuidan.',
      'No fumes ni enciendas fuego.',
      'No te refugies dentro de un coche.',
      'No salgas a mirar.',
    ],
    context: [
      'Si dudas de si debes confinarte, confínate.',
      'En Euskadi, la sirena de alerta son 3 señales de 1 minuto separadas por 5 segundos. El fin de la alerta es una señal continua de 30 segundos.',
    ],
    productCategories: ['herramientas'],
    sources: ['gencatChemical', 'gencatChemicalFaq', 'euskadiChemical'],
    essential: true,
  },
  {
    code: 'TE-05',
    slug: 'corte-de-agua',
    category: 'te',
    title: 'Corte de agua',
    metaTitle: 'Corte de agua: qué hacer mientras dura',
    summary: 'Cómo arreglarte mientras no sale agua del grifo.',
    description:
      'Cómo arreglarte durante un corte de agua: cierra los grifos, usa tu reserva, guarda agua para la cisterna y, cuando vuelva, déjala correr antes de beber.',
    steps: [
      { text: 'Cierra los grifos para que no se inunde nada cuando vuelva el agua.' },
      { text: 'Usa tu reserva de agua.', see: ['CL-04'] },
      { text: 'Guarda el agua que no sea para beber para la cisterna.', see: ['CL-07'] },
      { text: 'Cuando vuelva, deja correr el agua un rato antes de beber.' },
      { text: 'Si avisan de que no es potable, hiérvela o potabilízala.', see: ['CL-05'] },
    ],
    dont: ['No bebas agua de origen dudoso sin tratarla.'],
    productCategories: ['agua'],
    sources: ['gencatKit', 'gvaFloodWater'],
    essential: false,
  },
  {
    code: 'TE-06',
    slug: 'monoxido-de-carbono',
    category: 'te',
    title: 'Monóxido de carbono',
    metaTitle: 'Monóxido de carbono: síntomas y qué hacer',
    summary: 'Qué hacer si sospechas que hay monóxido de carbono en casa.',
    description:
      'Si varias personas tienen a la vez dolor de cabeza, mareo o náuseas, puede ser monóxido de carbono: sal al aire libre, llama al 112 y ventila la casa.',
    steps: [
      { text: 'Si varias personas tienen a la vez dolor de cabeza, mareo o náuseas, sal al aire libre.' },
      { text: 'Si es seguro, apaga el aparato que puede causarlo.' },
      { text: 'Llama al 112.', see: ['CL-01'] },
      { text: 'Ventila la casa abriendo puertas y ventanas.' },
    ],
    dont: [
      'No uses generadores, barbacoas, braseros ni estufas de camping dentro de casa, del garaje ni de una tienda de campaña.',
    ],
    context: [
      'El monóxido de carbono no huele ni se ve. Revisa las calderas y las estufas y ventila la casa cada día.',
    ],
    sources: ['gencatCarbonMonoxide'],
    essential: false,
  },
  {
    code: 'TE-07',
    slug: 'atrapado-en-un-ascensor',
    category: 'te',
    title: 'Atrapado en un ascensor o un transporte',
    metaTitle: 'Atrapado en un ascensor, tren o metro',
    summary: 'Qué hacer si te quedas encerrado en un ascensor, un tren o un metro.',
    description:
      'Qué hacer si te quedas encerrado en un ascensor, un tren o un metro: mantén la calma, pulsa la alarma, llama al 112 si nadie responde y no fuerces las puertas.',
    steps: [
      { text: 'Mantén la calma.' },
      { text: 'Pulsa el botón de alarma y habla por el interfono.' },
      { text: 'Si nadie responde, llama al 112.', see: ['CL-01'] },
      { text: 'En un tren o un metro, sigue las instrucciones del personal.' },
      { text: 'Espera sentado y ahorra batería.' },
    ],
    dont: ['No fuerces las puertas ni intentes salir por tu cuenta.'],
    sources: ['andalucia112', 'gencat112'],
    essential: false,
  },

  // PA · Primeros auxilios
  {
    code: 'PA-01',
    slug: 'rcp-adulto',
    category: 'pa',
    title: 'No responde y no respira: RCP en adultos',
    metaTitle: 'RCP en adultos paso a paso (guías ERC 2025)',
    summary: 'Qué hacer si un adulto no responde y no respira con normalidad.',
    description:
      'Qué hacer si un adulto no responde y no respira con normalidad: llama al 112, aprieta el centro del pecho 5-6 cm, 100-120 veces por minuto, y usa el DEA.',
    steps: [
      { text: 'Comprueba si responde: háblale fuerte y tócale los hombros. Mira si respira con normalidad.' },
      { text: 'Llama al 112 con el altavoz y pide que traigan un desfibrilador (DEA).', see: ['CL-01'] },
      { text: 'Aprieta fuerte en el centro del pecho: 5-6 cm de profundidad, 100-120 veces por minuto, sin parar.' },
      { text: 'Si sabes hacerlo, alterna 30 compresiones y 2 insuflaciones. Si no, haz solo compresiones.' },
      { text: 'Cuando llegue el DEA, enciéndelo y sigue sus instrucciones.' },
      { text: 'No pares hasta que llegue la ayuda o la persona empiece a despertar.' },
    ],
    dont: [
      'No confundas los boqueos (jadeos o ronquidos) con respirar: no es respirar con normalidad.',
      'No pierdas tiempo buscando el pulso.',
      'No tengas miedo de hacer daño: es peor no hacer nada.',
    ],
    call112: 'en cuanto veas que no responde y no respira con normalidad.',
    context: [
      'Las guías ERC 2025 lo resumen en 3 pasos: comprueba, llama y haz RCP.',
      'Al principio puede haber movimientos parecidos a una convulsión. Cuando paren, vuelve a mirar si respira. Si la persona está sobre un colchón, aprieta más fuerte.',
      'La RCP se aprende mejor practicando: Cruz Roja organiza cursos presenciales de primeros auxilios.',
    ],
    faq: [
      {
        question: '¿Y si no sé hacer insuflaciones?',
        answer:
          'Haz solo compresiones, fuertes y sin parar. El 112 te puede guiar por teléfono mientras llega la ayuda.',
      },
      {
        question: '¿Puedo usar un desfibrilador sin formación?',
        answer:
          'Sí. El DEA te dice en voz alta qué hacer en cada momento y solo da una descarga si la persona la necesita.',
      },
      {
        question: '¿Y si le hago daño?',
        answer:
          'Al hacer RCP se puede dañar alguna costilla, pero no hacerla es mucho peor: sin ayuda, una persona en parada no sobrevive.',
      },
    ],
    sources: ['ercAdultBls', 'ercGuidelines', 'cruzRojaCourses'],
    essential: true,
  },
  {
    code: 'PA-02',
    slug: 'rcp-nino-y-bebe',
    category: 'pa',
    title: 'RCP en niños y bebés',
    metaTitle: 'RCP en niños y bebés (guías ERC 2025)',
    summary: 'Qué hacer si un niño o un bebé no responde y no respira con normalidad.',
    description:
      'RCP en niños y bebés según las guías ERC 2025: llama al 112, da 5 insuflaciones y comprime un tercio del pecho, con los 2 pulgares en los bebés.',
    steps: [
      { text: 'Comprueba si responde y si respira con normalidad.' },
      { text: 'Llama al 112 con el altavoz. Si hay otra persona, que busque un DEA.', see: ['CL-01'] },
      { text: 'Da 5 insuflaciones para empezar.' },
      { text: 'Comprime un tercio del pecho: en bebés, con los 2 pulgares abrazando el pecho; en niños, con 1 o 2 manos.' },
      { text: 'Sigue con 15 compresiones y 2 insuflaciones si te has formado en RCP pediátrica. Si no, con 30 y 2.' },
      { text: 'Usa el DEA en cuanto llegue: sirve a cualquier edad.' },
    ],
    dont: ['Si estás solo, no retrases la RCP por ir a buscar el DEA.'],
    call112: 'en cuanto veas que no responde y no respira con normalidad.',
    sources: ['ercPaediatric', 'rcukPaediatric'],
    essential: true,
  },
  {
    code: 'PA-03',
    slug: 'posicion-lateral-de-seguridad',
    category: 'pa',
    title: 'Posición lateral de seguridad',
    metaTitle: 'Posición lateral de seguridad paso a paso',
    summary: 'Cómo poner de lado a una persona que no responde pero respira con normalidad.',
    description:
      'Cómo poner de lado, paso a paso, a quien no responde pero respira con normalidad, y cuándo no hacerlo: si respira con boqueos o ha tenido un golpe fuerte.',
    steps: [
      { text: 'Si no responde pero respira con normalidad, ponla de lado.' },
      { text: 'Estira hacia arriba el brazo que queda más cerca de ti.' },
      { text: 'Pon el dorso de su otra mano bajo su mejilla.' },
      { text: 'Dobla la rodilla del lado contrario y gira a la persona hacia ti.' },
      { text: 'Inclina un poco su cabeza hacia atrás para que respire bien.' },
      { text: 'Vigila su respiración cada minuto.' },
    ],
    dont: [
      'No la pongas de lado si respira con boqueos: haz RCP.',
      'No la muevas si ha sufrido un golpe fuerte o una caída.',
    ],
    call112: 'alguien no responde, aunque respire.',
    productCategories: ['primeros-auxilios'],
    sources: ['ercFirstAid'],
    essential: true,
  },
  {
    code: 'PA-04',
    slug: 'hemorragia-grave',
    category: 'pa',
    title: 'Hemorragia grave',
    metaTitle: 'Hemorragia grave: cómo parar el sangrado',
    summary: 'Cómo parar un sangrado fuerte hasta que llegue la ayuda.',
    description:
      'Cómo parar un sangrado fuerte hasta que llegue la ayuda: llama al 112, aprieta con una gasa, rellena las heridas profundas y usa un torniquete si sabes.',
    steps: [
      { text: 'Llama al 112.', see: ['CL-01'] },
      { text: 'Aprieta fuerte sobre la herida con una gasa o un paño limpio.' },
      { text: 'Si la herida es profunda, rellénala con gasa y sigue apretando.' },
      { text: 'Cuando deje de sangrar, pon un vendaje apretado.' },
      { text: 'Si un brazo o una pierna no deja de sangrar y tienes un torniquete que sabes usar, ponlo 5-7 cm por encima de la herida, nunca sobre una articulación.' },
      { text: 'Aprieta el torniquete hasta que pare de sangrar y apunta la hora.' },
    ],
    dont: [
      'No quites las gasas empapadas: pon otras encima.',
      'No aflojes ni quites el torniquete: eso solo lo hace un sanitario.',
    ],
    call112: 'la sangre sale a chorro o no para al apretar.',
    context: [
      'Cruz Roja aconseja apretar con firmeza durante 10 minutos. El torniquete duele: es normal.',
    ],
    faq: [
      {
        question: '¿Cuánto tiempo hay que apretar la herida?',
        answer:
          'Con firmeza y sin soltar para mirar. Cruz Roja aconseja apretar al menos 10 minutos.',
      },
      {
        question: '¿Se puede quitar el torniquete cuando para de sangrar?',
        answer:
          'No. Una vez puesto, solo lo quita un sanitario. Apunta la hora a la que lo pusiste para decírsela.',
      },
    ],
    productCategories: ['primeros-auxilios'],
    sources: ['ercFirstAid', 'cruzRojaFirstAid'],
    essential: true,
  },
  {
    code: 'PA-05',
    slug: 'atragantamiento-adulto-y-nino',
    category: 'pa',
    title: 'Atragantamiento: adultos y niños',
    metaTitle: 'Atragantamiento en adultos y niños: qué hacer',
    summary: 'Qué hacer si un adulto o un niño mayor de 1 año se atraganta.',
    description:
      'Qué hacer si un adulto o un niño mayor de 1 año se atraganta: anímale a toser y, si no puede, alterna 5 golpes en la espalda y 5 compresiones abdominales.',
    steps: [
      { text: 'Pregunta: «¿Te estás atragantando?».' },
      { text: 'Si puede toser, anímale a toser.' },
      { text: 'Si no puede, dale hasta 5 golpes en la espalda, entre los omóplatos, con la persona inclinada hacia delante.' },
      { text: 'Si no sale, dale hasta 5 compresiones abdominales.' },
      { text: 'Si sigue sin salir, llama al 112 y alterna 5 golpes y 5 compresiones.', see: ['CL-01'] },
      { text: 'Si deja de responder, empieza la RCP.', see: ['PA-01'] },
    ],
    dont: ['No metas los dedos en su boca a ciegas.'],
    context: ['Después de las compresiones abdominales, que le vea un médico aunque se encuentre bien.'],
    faq: [
      {
        question: '¿Cuándo basta con animarle a toser?',
        answer:
          'Mientras pueda toser, hablar o respirar. En ese caso, anímale a toser y no le des golpes.',
      },
      {
        question: '¿Hay que ir al médico después?',
        answer:
          'Sí, si le has hecho compresiones abdominales, aunque se encuentre bien: pueden causar lesiones internas.',
      },
    ],
    sources: ['ercFirstAid'],
    essential: true,
  },
  {
    code: 'PA-06',
    slug: 'atragantamiento-bebe',
    category: 'pa',
    title: 'Atragantamiento: bebés',
    metaTitle: 'Atragantamiento en bebés: qué hacer',
    summary: 'Qué hacer si un bebé menor de 1 año se atraganta.',
    description:
      'Qué hacer si un bebé menor de 1 año se atraganta: 5 golpes en la espalda, boca abajo sobre tu antebrazo, y 5 compresiones en el pecho con los 2 pulgares.',
    steps: [
      { text: 'Pon al bebé boca abajo sobre tu antebrazo, con la cabeza más baja que el cuerpo.' },
      { text: 'Dale hasta 5 golpes en la espalda.' },
      { text: 'Dale la vuelta y haz hasta 5 compresiones en el pecho con los 2 pulgares.' },
      { text: 'Alterna 5 golpes y 5 compresiones y llama al 112.', see: ['CL-01'] },
      { text: 'Si deja de responder, empieza la RCP de bebé.', see: ['PA-02'] },
    ],
    dont: ['No hagas compresiones abdominales a un bebé.', 'No metas los dedos en su boca a ciegas.'],
    sources: ['ercPaediatric', 'rcukPaediatric'],
    essential: false,
  },
  {
    code: 'PA-07',
    slug: 'quemaduras',
    category: 'pa',
    title: 'Quemaduras',
    metaTitle: 'Quemaduras: primeros auxilios paso a paso',
    summary: 'Cómo enfriar y cubrir una quemadura.',
    description:
      'Cómo actuar ante una quemadura: enfríala enseguida con agua del grifo 10-15 minutos, quita anillos y cúbrela sin apretar. Sin hielo ni pasta de dientes.',
    steps: [
      { text: 'Aparta a la persona de lo que la ha quemado.' },
      { text: 'Enfría la quemadura enseguida con un chorro suave de agua fría del grifo, no helada, durante 10-15 minutos o más si sigue doliendo.' },
      { text: 'Quita anillos, relojes y la ropa que no esté pegada a la piel.' },
      { text: 'Cubre la zona sin apretar con un apósito que no se pegue o con film transparente limpio.' },
      { text: 'En niños pequeños, vigila que no cojan frío.' },
    ],
    dont: [
      'No uses hielo, pasta de dientes, aceite ni remedios caseros.',
      'No revientes las ampollas.',
    ],
    call112: 'la quemadura es más grande que la palma de su mano, está en la cara, las manos, los pies o los genitales, la ha causado un producto químico o la electricidad, o a la persona le cuesta respirar.',
    context: [
      'Cruz Roja aconseja ir a un centro sanitario si el dolor sigue, salen ampollas o la piel parece carbonizada.',
    ],
    productCategories: ['primeros-auxilios'],
    sources: ['cruzRojaFirstAid'],
    essential: true,
  },
  {
    code: 'PA-08',
    slug: 'fracturas-y-golpes-en-la-cabeza',
    category: 'pa',
    title: 'Fracturas, esguinces y golpes en la cabeza',
    metaTitle: 'Fracturas, esguinces y golpes en la cabeza',
    summary: 'Qué hacer ante una posible fractura, un esguince o un golpe en la cabeza.',
    description:
      'Qué hacer ante una posible fractura, un esguince o un golpe en la cabeza: inmoviliza la zona, pon frío envuelto en un paño y vigila las señales de alarma.',
    steps: [
      { text: 'No muevas la zona: inmovilízala tal como está.' },
      { text: 'Pon frío envuelto en un paño.' },
      { text: 'Si ha habido una caída desde altura o un accidente, no le muevas el cuello y sujeta su cabeza en línea con el cuerpo.' },
      { text: 'Si tras un golpe en la cabeza está confuso, vomita, tiene mucho sueño o mucho dolor, que deje lo que está haciendo y que le vea un sanitario.' },
    ],
    dont: ['No intentes recolocar el hueso.'],
    call112: 'se ve el hueso, hay una deformidad grave, ha perdido el conocimiento o puede tener una lesión en el cuello.',
    productCategories: ['primeros-auxilios'],
    sources: ['ercFirstAid'],
    essential: false,
  },
  {
    code: 'PA-09',
    slug: 'hipotermia',
    category: 'pa',
    title: 'Hipotermia',
    metaTitle: 'Hipotermia: primeros auxilios',
    summary: 'Qué hacer si alguien se ha enfriado demasiado.',
    description:
      'Qué hacer si alguien se ha enfriado demasiado: llévale a un lugar sin viento, cambia su ropa mojada por seca, aíslale del suelo y abrígale, cabeza incluida.',
    steps: [
      { text: 'Llévala a un lugar protegido del viento.' },
      { text: 'Quítale la ropa mojada con cuidado y ponle ropa seca.' },
      { text: 'Aíslala del suelo.' },
      { text: 'Tápala con mantas y con la manta térmica, también la cabeza.', see: ['CL-09'] },
    ],
    dont: ['No la frotes.', 'No le des alcohol.', 'No la muevas de forma brusca.'],
    call112: 'tiembla mucho y de pronto deja de temblar, está confusa o tiene mucho sueño.',
    productCategories: ['refugio-y-abrigo'],
    sources: ['ercFirstAid', 'ercSpecialCircumstancesEs'],
    essential: false,
  },
  {
    code: 'PA-10',
    slug: 'golpe-de-calor',
    category: 'pa',
    title: 'Golpe de calor',
    metaTitle: 'Golpe de calor: señales y qué hacer',
    summary: 'Cómo enfriar a una persona con golpe de calor.',
    description:
      'El golpe de calor es una urgencia: llama al 112 y enfría a la persona ya, con agua fría por todo el cuerpo. Enfría primero y traslada después.',
    steps: [
      { text: 'Llama al 112: es una urgencia.', see: ['CL-01'] },
      { text: 'Llévala a la sombra o a un lugar fresco y quítale ropa.' },
      { text: 'Enfríala ya con agua fría por todo el cuerpo: si se puede, métela en agua fría hasta el cuello. Si no, usa duchas o paños mojados y un ventilador.' },
      { text: 'Sigue enfriando unos 15 minutos o hasta que vuelva a estar despierta y lúcida.' },
      { text: 'Enfría primero y traslada después.' },
    ],
    dont: ['No des de beber a una persona que no responde.'],
    call112: 'siempre: el golpe de calor es una urgencia.',
    context: ['Señales: piel muy caliente, 40 °C o más, confusión o convulsiones.'],
    faq: [
      {
        question: '¿Cuánto tiempo hay que enfriarle?',
        answer:
          'Unos 15 minutos o hasta que vuelva a estar despierto y lúcido. Lo más rápido y eficaz es meterle en agua fría hasta el cuello.',
      },
      {
        question: '¿Le doy de beber?',
        answer:
          'Solo si está despierto y puede tragar. A una persona que no responde nunca le des de beber.',
      },
      {
        question: '¿Por qué no llevarle directamente al hospital?',
        answer:
          'Porque el daño avanza mientras el cuerpo sigue tan caliente. Las guías ERC 2025 lo resumen así: enfría primero, traslada después.',
      },
    ],
    sources: ['ercFirstAid', 'sanidadHeat'],
    essential: true,
  },
  {
    code: 'PA-11',
    slug: 'reaccion-alergica-grave',
    category: 'pa',
    title: 'Reacción alérgica grave (anafilaxia)',
    metaTitle: 'Reacción alérgica grave (anafilaxia)',
    summary: 'Qué hacer ante una reacción alérgica grave.',
    description:
      'Qué hacer ante una reacción alérgica grave: llama al 112, ayúdale a usar su autoinyector de adrenalina en el muslo y túmbale; si le cuesta respirar, siéntale.',
    steps: [
      { text: 'Llama al 112.', see: ['CL-01'] },
      { text: 'Si tiene un autoinyector de adrenalina, ayúdale a ponérselo en la parte de fuera del muslo.' },
      { text: 'Túmbala. Si le cuesta respirar, siéntala con las piernas estiradas.' },
      { text: 'Si puedes, aparta lo que ha causado la reacción, por ejemplo, el aguijón.' },
      { text: 'Si a los 5 minutos no mejora y tiene otro autoinyector, usa la segunda dosis.' },
    ],
    dont: [
      'No la pongas de pie ni la hagas caminar.',
      'No uses adrenalina que no le hayan recetado.',
    ],
    call112: 'siempre, en cuanto sospeches una reacción alérgica grave.',
    context: [
      'Señales: le cuesta respirar o le pitan los pulmones, le salen habones, tiene la piel fría y sudorosa, se marea o vomita, justo después de comer algo o de una picadura.',
    ],
    sources: ['ercFirstAid'],
    essential: true,
  },
  {
    code: 'PA-12',
    slug: 'dolor-de-pecho-e-ictus',
    category: 'pa',
    title: 'Dolor de pecho e ictus',
    metaTitle: 'Dolor de pecho o ictus: qué hacer',
    summary: 'Qué hacer ante un dolor fuerte en el pecho o las señales de un ictus.',
    description:
      'Cómo reconocer un ictus (cara torcida, brazo que cae, habla rara) o un dolor de pecho grave, y qué hacer: llama al 112 enseguida y apunta la hora.',
    steps: [
      { text: 'Si le duele el pecho, siéntala cómoda y tranquilízala.' },
      { text: 'Llama al 112.', see: ['CL-01'] },
      { text: 'Si el 112 te lo indica y no es alérgica, dale una aspirina para masticar.' },
      { text: 'Si ves la cara torcida, un brazo que cae o que habla raro, puede ser un ictus: llama al 112 enseguida.' },
      { text: 'Apunta la hora a la que empezaron los síntomas.' },
      { text: 'Quédate con ella hasta que llegue la ayuda.' },
    ],
    dont: ['No la lleves tú en coche si puede venir una ambulancia.'],
    call112: 'siempre, en cuanto aparezcan los síntomas.',
    context: ['Para reconocer un ictus se usa la regla FAST (en inglés): cara, brazo, habla y tiempo.'],
    sources: ['ercFirstAid'],
    essential: false,
  },
  {
    code: 'PA-13',
    slug: 'bajada-de-azucar',
    category: 'pa',
    title: 'Bajada de azúcar (hipoglucemia)',
    metaTitle: 'Bajada de azúcar (hipoglucemia): qué hacer',
    summary: 'Qué hacer si una persona con diabetes tiene una bajada de azúcar.',
    description:
      'Qué hacer si una persona con diabetes tiene una bajada de azúcar: si puede tragar, dale 15-20 g de azúcar y espera 15 minutos; si no responde, llama al 112.',
    steps: [
      { text: 'Si una persona con diabetes está rara, sudorosa o confusa y puede tragar, dale 15-20 g de azúcar: tabletas de glucosa, un zumo o un refresco con azúcar.' },
      { text: 'Espera 15 minutos. Si sigue igual, repite.' },
      { text: 'Cuando mejore, que coma algo.' },
      { text: 'Si deja de responder, llama al 112 y ponla en posición lateral de seguridad.', see: ['PA-03'] },
    ],
    dont: ['No des nada por la boca a quien no responde.'],
    call112: 'no responde o no mejora después de tomar azúcar.',
    sources: ['ercFirstAid'],
    essential: false,
  },
  {
    code: 'PA-14',
    slug: 'ahogamiento',
    category: 'pa',
    title: 'Ahogamiento',
    metaTitle: 'Ahogamiento: cómo ayudar sin ponerte en peligro',
    summary: 'Cómo ayudar a alguien que se ahoga sin ponerte en peligro.',
    description:
      'Cómo ayudar a alguien que se ahoga sin ponerte en peligro: lánzale algo que flote, llama al 112 y, fuera del agua, da 5 insuflaciones y empieza la RCP.',
    steps: [
      { text: 'Lánzale algo que flote.' },
      { text: 'Llama al 112.', see: ['CL-01'] },
      { text: 'Ya fuera del agua, si no respira con normalidad, da 5 insuflaciones y empieza la RCP.', see: ['PA-01'] },
      { text: 'Sécale el pecho antes de poner el DEA.' },
      { text: 'Abrígale.' },
    ],
    dont: ['No te metas en el agua si no te has formado en rescate: podéis ahogaros los dos.'],
    call112: 'siempre, aunque parezca que se ha recuperado.',
    sources: ['ercFirstAid', 'ercSpecialCircumstancesEs'],
    essential: false,
  },
  {
    code: 'PA-15',
    slug: 'mordedura-de-vibora-y-picaduras',
    category: 'pa',
    title: 'Mordedura de víbora y picaduras',
    metaTitle: 'Mordedura de víbora y picaduras',
    summary: 'Qué hacer ante una mordedura de serpiente o una picadura.',
    description:
      'Qué hacer ante una mordedura de víbora o una picadura: llama al 112, mantén quieta a la persona e inmoviliza el miembro. Sin torniquete, sin cortar ni chupar.',
    steps: [
      { text: 'Llama al 112.', see: ['CL-01'] },
      { text: 'Mantén a la persona quieta y tranquila.' },
      { text: 'Inmoviliza el brazo o la pierna, sin levantarlo.' },
      { text: 'Quita anillos, relojes y ropa apretada.' },
      { text: 'Si es una picadura de abeja o avispa, quita el aguijón. Si hay señales de alergia, sigue la tarjeta de anafilaxia.', see: ['PA-11'] },
    ],
    dont: [
      'No pongas un torniquete.',
      'No cortes ni chupes la herida.',
      'No pongas hielo directamente sobre la piel ni apliques calor.',
    ],
    call112: 'siempre ante una mordedura de serpiente.',
    context: ['En la península hay víboras. Sus mordeduras son poco frecuentes, pero necesitan atención sanitaria.'],
    sources: ['sitSnakeBite', 'ercFirstAid'],
    essential: false,
  },
  {
    code: 'PA-16',
    slug: 'heridas-pequenas',
    category: 'pa',
    title: 'Heridas pequeñas y signos de infección',
    metaTitle: 'Cómo curar una herida pequeña',
    summary: 'Cómo limpiar y tapar una herida pequeña, y cuándo consultar.',
    description:
      'Cómo limpiar y tapar una herida pequeña paso a paso, según Cruz Roja, y cuándo consultar: si se enrojece cada vez más, sale pus, hay fiebre o huele mal.',
    steps: [
      { text: 'Lávate bien las manos con agua y jabón.' },
      { text: 'Lava la herida a chorro con agua y jabón o con suero fisiológico.' },
      { text: 'Limpia de dentro hacia fuera y aplica un antiséptico con una gasa.' },
      { text: 'Cúbrela con un apósito o con una gasa.' },
      { text: 'Cambia el apósito cada día.' },
    ],
    dont: ['No tapes la herida sin lavarla antes.'],
    context: ['Consulta a un sanitario si la zona se pone cada vez más roja, sale pus, tienes fiebre o huele mal.'],
    productCategories: ['primeros-auxilios'],
    sources: ['cruzRojaFirstAid'],
    essential: false,
  },
  {
    code: 'PA-17',
    slug: 'intoxicacion',
    category: 'pa',
    title: 'Intoxicación',
    metaTitle: 'Intoxicación: qué hacer y a quién llamar',
    summary: 'Qué hacer si alguien ha tragado, respirado o tocado un producto tóxico.',
    description:
      'Qué hacer ante una intoxicación: aparta a la persona del producto, guarda el envase y llama al Servicio de Información Toxicológica, 91 562 04 20, 24 horas.',
    steps: [
      { text: 'Aparta a la persona del producto y ventila.' },
      { text: 'Guarda el envase para saber qué ha tomado.' },
      { text: 'Llama al Servicio de Información Toxicológica: 91 562 04 20, las 24 horas.' },
      { text: 'Si el producto ha caído en la piel o en los ojos, lávalos con mucha agua.' },
    ],
    dont: ['No provoques el vómito.', 'No le des leche ni otros remedios caseros.'],
    call112: 'está inconsciente, le cuesta respirar o tiene convulsiones.',
    sources: ['sitService', 'sitChildren'],
    essential: false,
  },

  // AD · Tarjetas extra (online only)
  {
    code: 'AD-01',
    slug: 'ninos',
    category: 'ad',
    title: 'Niños',
    metaTitle: 'Emergencias con niños: cómo prepararlos',
    summary: 'Cómo preparar a los niños y qué añadir al kit para ellos.',
    description:
      'Cómo preparar a los niños para una emergencia: explicarles lo que pasa, enseñarles el punto de encuentro y el 112, y qué añadir al kit para ellos.',
    steps: [
      { text: 'Explícales lo que pasa con calma y con palabras sencillas.' },
      { text: 'Mete en el kit un juego o su objeto preferido.' },
      { text: 'Enséñales el punto de encuentro y cómo llamar al 112.', see: ['CL-03', 'CL-01'] },
      { text: 'Añade al kit lo que necesiten: pañales, leche, ropa de recambio.' },
      { text: 'Si tenéis que salir de casa, ponles zapatos.' },
    ],
    dont: ['No les dejes solos durante una emergencia.'],
    sources: ['gencatKit', 'gencatFamilyPlan'],
    essential: false,
    extra: true,
  },
  {
    code: 'AD-02',
    slug: 'mascotas',
    category: 'ad',
    title: 'Mascotas',
    metaTitle: 'Emergencias con mascotas: qué preparar',
    summary: 'Qué preparar para tu mascota en una emergencia.',
    description:
      'Qué preparar para tu mascota en una emergencia: transportín y correa, comida y agua para 3 días, su cartilla sanitaria, el microchip al día y una foto reciente.',
    steps: [
      { text: 'Prepara un transportín y una correa.' },
      { text: 'Guarda comida y agua para 3 días.' },
      { text: 'Lleva su cartilla sanitaria y mantén al día su microchip.' },
      { text: 'Guarda una foto reciente por si se pierde.' },
    ],
    dont: ['No la dejes dentro de un coche al sol.'],
    sources: ['gencatKit'],
    essential: false,
    extra: true,
  },
  {
    code: 'AD-03',
    slug: 'personas-mayores',
    category: 'ad',
    title: 'Personas mayores y dependientes',
    metaTitle: 'Emergencias con personas mayores',
    summary: 'Qué preparar si en casa vive una persona mayor o dependiente.',
    description:
      'Qué preparar si en casa vive una persona mayor o dependiente: lista de medicación, gafas y audífonos con pilas de repuesto, su andador y un vecino pendiente.',
    steps: [
      { text: 'Haz una lista de su medicación y de las dosis.' },
      { text: 'Mete en el kit sus gafas, sus audífonos y pilas de repuesto.' },
      { text: 'Ten a mano su andador o sus muletas.' },
      { text: 'Pide a un vecino que esté pendiente.' },
      { text: 'Con calor, pregunta a su médico si alguno de sus medicamentos aumenta el riesgo.', see: ['NA-04'] },
    ],
    dont: ['No la dejes sola durante una ola de calor.'],
    sources: ['sanidadHeat', 'sanidadOlderPeople', 'gencatKit'],
    essential: false,
    extra: true,
  },
  {
    code: 'AD-04',
    slug: 'medicacion-y-equipos-medicos',
    category: 'ad',
    title: 'Medicación y equipos médicos',
    metaTitle: 'Medicación y equipos médicos en una emergencia',
    summary: 'Cómo preparar la medicación y los equipos médicos para una emergencia.',
    description:
      'Cómo preparar la medicación y los equipos médicos para una emergencia: reserva para varios días, lista de dosis, insulina en frío y un plan para la batería.',
    steps: [
      { text: 'Ten una reserva de medicación para varios días.' },
      { text: 'Guarda una lista con los medicamentos y las dosis.' },
      { text: 'Si usas insulina, ten una nevera portátil para mantenerla fría.' },
      { text: 'Si usas un equipo que funciona con electricidad, como un concentrador de oxígeno, ten un plan para la batería.' },
      { text: 'Informa a tu compañía eléctrica si en casa hay un equipo médico vital.' },
    ],
    dont: ['No dejes los medicamentos al sol ni dentro del coche.'],
    sources: ['aempsMedicinesHeat', 'gencatKit'],
    essential: false,
    extra: true,
  },
  {
    code: 'AD-05',
    slug: 'kit-para-el-coche',
    category: 'ad',
    title: 'Coche',
    metaTitle: 'Kit de emergencia para el coche: qué llevar',
    summary: 'Qué llevar en el coche por si te quedas atrapado en la carretera.',
    description:
      'Qué llevar en el coche por si te quedas atrapado en la carretera: manta, agua, linterna, móvil cargado, chaleco y baliza V16, y el depósito lleno.',
    steps: [
      { text: 'Lleva en el coche una manta, agua, una linterna y el móvil cargado.' },
      { text: 'Si hay aviso de mal tiempo, sal con el depósito lleno.' },
      { text: 'Lleva el chaleco reflectante y la baliza de emergencia V16.' },
      { text: 'Repasa las tarjetas de coche atrapado, inundación, RCP y hemorragia.', see: ['EV-03', 'NA-02', 'PA-01', 'PA-04'] },
    ],
    dont: ['No cruces tramos inundados.'],
    productCategories: ['luz-y-energia', 'refugio-y-abrigo'],
    sources: ['gencatKit', 'dgtRoadEmergencies', 'gencatSnow'],
    essential: false,
    extra: true,
  },
];
