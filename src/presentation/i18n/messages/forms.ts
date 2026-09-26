/** Copy for shared form helpers, the newsletter form and the contact page. */
export const forms = {
  validation: {
    required: 'Este campo es obligatorio.',
    invalidEmail: 'Introduce un correo electrónico válido, por ejemplo nombre@dominio.es.',
    invalidPhone: 'Introduce un teléfono español de 9 cifras, por ejemplo 612 345 678.',
    invalidPostalCode: 'Introduce un código postal español de 5 cifras, por ejemplo 28013.',
    unsupportedRegion: 'Por ahora solo enviamos a la España peninsular y a las islas Baleares.',
    postalCodeMismatch: 'Este código postal no corresponde a la provincia seleccionada.',
    tooShort: (min?: number) =>
      min ? `Escribe al menos ${min} caracteres.` : 'El texto es demasiado corto.',
    tooLong: (max?: number) =>
      max ? `Escribe como máximo ${max} caracteres.` : 'El texto es demasiado largo.',
  },
  /** Shown next to forms whose submissions are only simulated (no mail/CRM backend connected). */
  simulatedNotice: 'Modo demostración: este formulario todavía no envía los datos a ninguna parte.',
  errorSummary: {
    title: (count: number) =>
      count === 1 ? 'Revisa el siguiente campo:' : `Revisa los siguientes ${count} campos:`,
  },
  newsletter: {
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'tu@correo.es',
    submit: 'Suscribirme',
    success: '¡Gracias! Te hemos apuntado a la lista.',
    simulatedSuccess: 'Recibido. En modo demostración no guardamos tu correo.',
    privacyPrefix: 'Solo usaremos tu correo para enviarte novedades de Bugout. Más información en la',
    privacyLink: 'política de privacidad',
  },
  contact: {
    metadata: {
      title: 'Contacto',
      description:
        'Escríbenos si tienes dudas sobre un kit, un pedido o una compra para tu empresa o grupo.',
    },
    title: 'Contacto',
    intro: '¿Tienes dudas sobre un kit, un pedido o una compra para tu empresa o grupo? Escríbenos.',
    formTitle: 'Escríbenos',
    fields: {
      name: 'Nombre',
      email: 'Correo electrónico',
      topic: 'Tema',
      subject: 'Asunto',
      message: 'Mensaje',
    },
    topics: {
      general: 'Consulta general',
      order: 'Mi pedido',
      product: 'Información sobre un producto',
      wholesale: 'Empresas y pedidos para grupos',
    },
    messageCounter: (length: number, max: number) => `${length} / ${max} caracteres`,
    messageHint: (min: number) => `Mínimo ${min} caracteres.`,
    submit: 'Enviar mensaje',
    successTitle: 'Mensaje enviado',
    successText: 'Te responderemos lo antes posible.',
    simulatedSuccessTitle: 'Gracias por escribirnos',
    simulatedSuccessText: 'Recibido. En modo demostración el mensaje no se envía a nadie.',
    sendAnother: 'Enviar otro mensaje',
    help: {
      title: 'Antes de escribirnos',
      shippingTitle: 'Envíos',
      shippingText: 'Enviamos a la España peninsular y a las islas Baleares.',
      freeShipping: (threshold: string) => `Envío estándar gratis a partir de ${threshold}.`,
      returnsTitle: 'Devoluciones',
      returnsText: (days: number) => `Tienes ${days} días desde la entrega para devolver tu pedido.`,
      shippingReturnsLink: 'Ver envíos y devoluciones',
      emailTitle: 'Correo electrónico',
      emailText: 'También puedes escribirnos directamente a',
    },
    faq: {
      title: 'Preguntas frecuentes',
      returnsQuestion: '¿Puedo devolver un pedido?',
      returnsAnswer: (days: number) =>
        `Sí. Tienes ${days} días desde la entrega para devolverlo. Consulta las condiciones en`,
      returnsLink: 'Envíos y devoluciones',
      shippingQuestion: '¿A dónde enviáis y cuánto tarda?',
      shippingAnswer: 'Enviamos a la España peninsular y a las islas Baleares. Puedes elegir entre estas opciones al finalizar la compra:',
      shippingRate: (label: string, estimate: string, price: string) => `${label}: ${estimate}, ${price}.`,
      freeFrom: (threshold: string) => `gratis a partir de ${threshold}`,
      wholesaleQuestion: '¿Hacéis pedidos para empresas o grupos?',
      wholesaleAnswer: (topic: string, simulated: boolean) =>
        simulated
          ? `Sí. Cuando el formulario de esta página esté conectado, podrás usarlo con el tema «${topic}» para contarnos qué necesitas y cuántas unidades.`
          : `Sí. Usa el formulario de esta página con el tema «${topic}» y cuéntanos qué necesitas y cuántas unidades. Te responderemos por correo.`,
      orderStatusQuestion: '¿Cómo consulto el estado de mi pedido?',
      /** Follows the contact channel ("Escríbenos a …"). */
      orderStatusAnswer: 'e indica el número de pedido que aparece en la confirmación y el correo con el que compraste.',
      taxQuestion: '¿Los precios incluyen IVA?',
      taxIncludedAnswer: (rate: string) => `Sí. Todos los precios de la tienda incluyen el IVA (${rate} %).`,
      taxExcludedAnswer: (rate: string) => `No. El IVA (${rate} %) se añade al finalizar la compra.`,
    },
  },
} as const;
