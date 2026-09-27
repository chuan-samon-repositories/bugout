/** Copy for the cart area: provider notifications and the cart drawer. */
export const cart = {
  title: 'Tu carrito',
  empty: 'Tu carrito está vacío.',
  emptyHint: 'Echa un vistazo a nuestros kits y accesorios.',
  loadError: 'No hemos podido cargar tu carrito.',
  retryLoad: 'Reintentar',
  checkoutEmpty: 'Tu carrito está vacío. Añade algún producto para finalizar la compra.',
  /** The store kept fewer units than asked for (not enough stock). */
  quantityReduced: (name: string, quantity: number) =>
    `Solo ${quantity === 1 ? 'queda 1 unidad' : `quedan ${quantity} unidades`} de ${name}, así que hemos ajustado la cantidad de tu carrito.`,
  /** The store dropped the line (sold out or no longer sold). */
  lineRemoved: (name: string) => `Hemos quitado ${name} de tu carrito porque ya no está disponible.`,
  browseProducts: 'Ver productos',
  lines: 'Productos en tu carrito',
  unitPrice: 'Precio por unidad',
  quantity: 'Cantidad',
  lineSubtotal: 'Total de la línea',
  decrease: (name: string) => `Reducir cantidad de ${name}`,
  increase: (name: string) => `Aumentar cantidad de ${name}`,
  remove: (name: string) => `Eliminar ${name} del carrito`,
  subtotal: 'Subtotal',
  freeShippingRemaining: (amount: string, method: string) => `Te faltan ${amount} para el envío ${method} gratis`,
  freeShippingReached: (method: string) => `Tienes envío ${method} gratis`,
  taxIncluded: 'IVA incluido. El envío se calcula al finalizar la compra.',
  taxExcluded: 'Los impuestos y el envío se calculan al finalizar la compra.',
  checkout: 'Finalizar compra',
  continueShopping: 'Seguir comprando',
  clear: 'Vaciar carrito',
  clearConfirm: '¿Seguro que quieres vaciar el carrito?',
  clearConfirmYes: 'Sí, vaciar',
  clearConfirmNo: 'Cancelar',
} as const;
