import type { SourceId } from './sources';
import type { CardCode } from './types';

/** A line of the emergency kit checklist, with the cards that explain it and the catalog products that cover it. */
export interface ChecklistItem {
  label: string;
  note?: string;
  cards?: readonly CardCode[];
  /** Catalog slugs (Shopify handles); lines whose products are not in the catalog show no product link. */
  productSlugs?: readonly string[];
}

export interface ChecklistGroup {
  id: string;
  title: string;
  intro?: string;
  items: readonly ChecklistItem[];
}

/** Litres of drinking water per person and day this guide recommends (card CL-04; the Generalitat's minimum is 1,5). */
export const WATER_LITRES_PER_PERSON_PER_DAY = 2;

/** Days of self-sufficiency the European Commission recommends. */
export const SELF_SUFFICIENCY_DAYS = 3;

/**
 * The emergency kit checklist (`/preparate/lista-del-kit-de-emergencia`), following Protección Civil de la
 * Generalitat's kit lists (basic kit, staying at home, evacuating, family needs, car) and the EU's 72 hours.
 * Written in our own words; every line comes from `CHECKLIST_SOURCES`.
 */
export const KIT_CHECKLIST: readonly ChecklistGroup[] = [
  {
    id: 'basico',
    title: 'Lo básico',
    intro: 'Lo que necesitas tanto si te quedas en casa como si tienes que salir.',
    items: [
      {
        label: 'Agua potable',
        note: 'Al menos 2 litros por persona y día para beber.',
        cards: ['CL-04', 'CL-05'],
        productSlugs: ['cantimplora-1l'],
      },
      {
        label: 'Botiquín y tu medicación habitual',
        note: 'Con la lista de medicamentos y dosis.',
        cards: ['PA-04', 'AD-04'],
        productSlugs: ['kit-medicina'],
      },
      {
        label: 'Linterna o frontal, con pilas de repuesto',
        note: 'Mejor que las velas: no hay riesgo de incendio.',
        cards: ['CL-08'],
        productSlugs: ['frontal', 'lampara-camping'],
      },
      {
        label: 'Radio de pilas o de manivela',
        note: 'Para seguir la información oficial sin cobertura ni luz.',
        cards: ['CL-02', 'CL-08'],
        productSlugs: ['radio-solar'],
      },
      {
        label: 'Documentación en una bolsa impermeable',
        note: 'DNI, tarjeta sanitaria y pólizas de seguro.',
        productSlugs: ['bolsa-hermetica'],
      },
      { label: 'Dinero en efectivo y tarjeta bancaria', note: 'Los pagos con tarjeta pueden fallar sin luz.', cards: ['TE-01'] },
      { label: 'Móvil con cargador y, si puedes, una batería externa', cards: ['CL-03'] },
      {
        label: 'Gafas, audífonos, bastón o andador',
        note: 'Con sus pilas de repuesto, si las usan.',
        cards: ['AD-03'],
      },
      { label: 'La ficha familiar, en papel', note: 'Teléfonos, puntos de encuentro, alergias y medicación.', cards: ['CL-10'] },
    ],
  },
  {
    id: 'en-casa',
    title: 'Si te quedas en casa',
    items: [
      { label: 'Comida de larga duración que no haya que cocinar', note: 'Por ejemplo, conservas y frutos secos.', cards: ['CL-06'] },
      { label: 'Productos para la higiene sin agua corriente', cards: ['CL-07'], productSlugs: ['neceser'] },
    ],
  },
  {
    id: 'evacuar',
    title: 'Si tienes que salir de casa',
    intro: 'Puede que tardes en volver: completa lo básico con esto.',
    items: [
      { label: 'Ropa y calzado de repuesto', cards: ['EV-01'] },
      { label: 'Impermeable', productSlugs: ['poncho-termico'] },
      { label: 'Productos de higiene personal', productSlugs: ['neceser'] },
      { label: 'Llaves de casa y del coche' },
    ],
  },
  {
    id: 'familia',
    title: 'Para tu familia',
    intro: 'Piensa en lo que necesita cada persona de la casa.',
    items: [
      { label: 'Pañales y comida para bebés', cards: ['AD-01'] },
      { label: 'Una pulsera identificadora para cada niño', note: 'Por si se pierden o se desorientan.', cards: ['AD-01'] },
      {
        label: 'Para tu mascota: transportín, correa, comida y agua para varios días',
        note: 'Con su cartilla, su medicación y una foto reciente.',
        cards: ['AD-02'],
      },
    ],
  },
  {
    id: 'coche',
    title: 'En el coche',
    intro: 'Si hay aviso de mal tiempo y tienes que conducir.',
    items: [
      { label: 'Agua y comida energética que no se estropee', note: 'Frutos secos sin sal, fruta seca, caramelos duros.' },
      { label: 'Manta o ropa de abrigo', cards: ['EV-03'], productSlugs: ['manta-termica'] },
      { label: 'Linterna con pilas de repuesto', productSlugs: ['frontal'] },
      { label: 'Baliza de emergencia V16 y ropa de colores vivos', cards: ['AD-05'] },
      { label: 'Cadenas y pala o cepillo para la nieve' },
      { label: 'Botiquín', productSlugs: ['kit-medicina'] },
      { label: 'El depósito lleno antes de salir', cards: ['EV-03'] },
    ],
  },
];

/** The official pages the checklist follows, most relevant first. */
export const CHECKLIST_SOURCES: readonly SourceId[] = ['gencatKit', 'euPreparedness', 'gencatFamilyPlan', 'dgtRoadEmergencies'];

/** The people options the kits are sold for, for the water table. */
export const CHECKLIST_PEOPLE = [1, 2, 4] as const;

/** Litres of drinking water for `people` over the recommended days. */
export function drinkingWaterLitres(people: number): number {
  return WATER_LITRES_PER_PERSON_PER_DAY * SELF_SUFFICIENCY_DAYS * people;
}
