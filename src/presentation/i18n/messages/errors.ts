/** User-facing error copy. Keep technical details out of these strings. */
export const errors = {
  outOfStock: (productName: string) => `${productName} está agotado.`,
  maxQuantity: (max: number) => `Puedes añadir como máximo ${max} unidades de cada producto.`,
  productNotFound: 'Este producto ya no está disponible.',
  cartUnavailable: 'No hemos podido actualizar tu carrito. Inténtalo de nuevo.',
  checkoutUnavailable: 'No hemos podido iniciar el pago. Inténtalo de nuevo en unos segundos.',
  generic: 'Algo ha salido mal. Inténtalo de nuevo.',
  catalogUnavailable: 'No hemos podido cargar el catálogo. Inténtalo de nuevo en unos minutos.',
} as const;
