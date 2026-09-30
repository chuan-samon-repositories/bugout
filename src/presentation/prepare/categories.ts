import type { CardCategory, CategoryId } from './types';

/**
 * The deck's categories, in deck order. Colour, letters and shape match the printed cards; the colours
 * follow ISO 3864/7010 (green: first aid, red: fire, blue: mandatory action) and are the `deck-*` theme
 * tokens (see `deckColorClasses` in `components/prepare/CardCodeBadge.tsx`).
 */
export const CARD_CATEGORIES: readonly CardCategory[] = [
  {
    id: 'pm',
    name: 'Primeros minutos',
    description: 'Qué hacer nada más empezar una emergencia y cómo decidir.',
    shape: 'circle',
    anchor: 'primeros-minutos',
  },
  {
    id: 'cl',
    name: 'Comunicación y logística',
    description: 'El 112, los avisos oficiales, el plan familiar, el agua, la comida y la luz.',
    shape: 'square',
    anchor: 'comunicacion-y-logistica',
  },
  {
    id: 'ev',
    name: 'Evacuación y confinamiento',
    description: 'Salir de casa, quedarse dentro, quedarse atrapado en el coche y volver.',
    shape: 'arrow',
    anchor: 'evacuacion-y-confinamiento',
  },
  {
    id: 'na',
    name: 'Fenómenos naturales',
    description: 'Lluvias torrenciales, inundaciones, incendios forestales, calor, frío, terremotos y temporales.',
    shape: 'diamond',
    anchor: 'fenomenos-naturales',
  },
  {
    id: 'te',
    name: 'Incidentes en casa y tecnológicos',
    description: 'Apagones, gas, fuego, accidentes químicos, cortes de agua y monóxido de carbono.',
    shape: 'pentagon',
    anchor: 'incidentes-en-casa',
  },
  {
    id: 'pa',
    name: 'Primeros auxilios',
    description: 'RCP, hemorragias, atragantamientos, quemaduras y otras urgencias.',
    shape: 'cross',
    anchor: 'primeros-auxilios',
  },
  {
    id: 'ad',
    name: 'Tarjetas extra',
    description: 'Consejos para hogares con niños, mascotas, personas mayores, medicación o coche.',
    shape: 'star',
    anchor: 'tarjetas-extra',
  },
];

export function cardCategory(id: CategoryId): CardCategory {
  const category = CARD_CATEGORIES.find((candidate) => candidate.id === id);
  if (!category) throw new Error(`Unknown card category: ${id}`);
  return category;
}
