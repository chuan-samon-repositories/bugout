import type { Source } from './types';

const GENCAT = 'https://interior.gencat.cat/es/arees_dactuacio/proteccio_civil/consells_autoproteccio_emergencia';
const GENCAT_CA = 'https://interior.gencat.cat/ca/arees_dactuacio/proteccio_civil/consells_autoproteccio_emergencia';
const PROTECCION_CIVIL = 'Protección Civil y Emergencias (Ministerio del Interior)';
const GENCAT_PC = 'Protección Civil de la Generalitat de Catalunya';
const ERC = 'European Resuscitation Council (ERC)';
const SIT = 'Servicio de Información Toxicológica (Ministerio de Justicia)';
const SANIDAD = 'Ministerio de Sanidad';
const MADRID = 'Comunidad de Madrid';

/**
 * Official pages that back the cards' advice. Every URL was opened and checked to contain the advice it
 * backs; `cards.test.ts` checks that each one is used. Link official pages only: no news, blogs or shops.
 */
export const SOURCES = {
  ercGuidelines: {
    organisation: ERC,
    title: 'Guías ERC 2025 de reanimación y primeros auxilios',
    url: 'https://www.erc.edu/science-research/guidelines/guidelines-2025/guidelines-2025-english',
    language: 'en',
  },
  ercFirstAid: {
    organisation: ERC,
    title: 'Guías ERC 2025: primeros auxilios',
    url: 'https://doi.org/10.1016/j.resuscitation.2025.110752',
    language: 'en',
  },
  ercAdultBls: {
    organisation: ERC,
    title: 'Guías ERC 2025: soporte vital básico del adulto',
    url: 'https://doi.org/10.1016/j.resuscitation.2025.110771',
    language: 'en',
  },
  ercPaediatric: {
    organisation: ERC,
    title: 'Guías ERC 2025: soporte vital pediátrico',
    url: 'https://doi.org/10.1016/j.resuscitation.2025.110767',
    language: 'en',
  },
  ercSpecialCircumstancesEs: {
    organisation: ERC,
    title: 'Guías ERC 2025: situaciones especiales (traducción oficial al español)',
    url: 'https://www.erc.edu/media/sgadymu4/gl2025-06-spec-es.pdf',
    language: 'es',
  },
  rcukPaediatric: {
    organisation: 'Resuscitation Council UK',
    title: 'Paediatric basic life support guidelines 2025',
    url: 'https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/paediatric-basic-life-support-guidelines',
    language: 'en',
  },
  cruzRojaFirstAid: {
    organisation: 'Cruz Roja Española',
    title: 'Cuídate… por ejemplo: guía de primeros auxilios',
    url: 'https://www.cruzroja.es/prevencion/descargas/publicaciones/cuidate-por-ejemplo-CUIDATE_PRIM_AUX.pdf',
    language: 'es',
  },
  cruzRojaCourses: {
    organisation: 'Cruz Roja Española',
    title: 'Cursos de primeros auxilios',
    url: 'https://www2.cruzroja.es/cursos-primeros-auxilios',
    language: 'es',
  },
  sitService: {
    organisation: SIT,
    title: '¿Qué es el Servicio de Información Toxicológica?',
    url: 'https://www.mjusticia.gob.es/es/institucional/organismos/instituto-nacional/servicios/servicio-informacion/servicio-informacion1',
    language: 'es',
  },
  sitChildren: {
    organisation: SIT,
    title: 'Prevención de intoxicaciones en niños',
    url: 'https://www.mjusticia.gob.es/es/institucional/organismos/instituto-nacional/servicios/servicio-informacion/prevencion-intoxicaciones/ninos',
    language: 'es',
  },
  sitSnakeBite: {
    organisation: 'Instituto Nacional de Toxicología y Ciencias Forenses',
    title: 'Mordedura de serpiente: identificación, primeros auxilios y contraindicaciones',
    url: 'https://www.mjusticia.gob.es/es/ElMinisterio/OrganismosMinisterio/Documents/1292428319993-Identificacion__primeros_auxilios_y_contraindicaciones_en_caso_de_una_mordedura_de_serpiente.PDF',
    language: 'es',
  },
  sanidadHeat: {
    organisation: SANIDAD,
    title: 'Calor extremo: plan y recomendaciones',
    url: 'https://www.sanidad.gob.es/areas/sanidadAmbiental/riesgosAmbientales/calorExtremo/home.htm',
    language: 'es',
  },
  sanidadCold: {
    organisation: SANIDAD,
    title: 'Frío extremo: plan y recomendaciones',
    url: 'https://www.sanidad.gob.es/areas/sanidadAmbiental/riesgosAmbientales/frioExtremo/home.htm',
    language: 'es',
  },
  sanidadDana: {
    organisation: SANIDAD,
    title: 'Información sanitaria sobre la DANA: preguntas frecuentes',
    url: 'https://www.sanidad.gob.es/en/areas/alertasEmergenciasSanitarias/alertasActuales/infoDana/faq/home.htm',
    language: 'es',
  },
  sanidadOlderPeople: {
    organisation: SANIDAD,
    title: 'Fragilidad y caídas en la persona mayor',
    url: 'https://www.sanidad.gob.es/areas/promocionPrevencion/envejecimientoSaludable/fragilidadCaidas/docs/FragilidadyCaidas_personamayor.pdf',
    language: 'es',
  },
  aempsMedicinesHeat: {
    organisation: 'Agencia Española de Medicamentos y Productos Sanitarios (AEMPS)',
    title: 'Cómo conservar los medicamentos en verano',
    url: 'https://www.aemps.gob.es/informa/notasinformativas/la-aemps-recuerda-como-conservar-los-medicamentos-en-verano/',
    language: 'es',
  },
  aesanFridge: {
    organisation: 'Agencia Española de Seguridad Alimentaria y Nutrición (AESAN)',
    title: 'Alimentos refrigerados tras un corte de luz',
    url: 'https://www.aesan.gob.es/actualidad/actualidad-noticias/alimentos_refrigerados',
    language: 'es',
  },
  acsaBlackout: {
    organisation: 'Agencia Catalana de Seguridad Alimentaria',
    title: 'Consejos en caso de corte en el suministro eléctrico',
    url: 'https://acsa.gencat.cat/es/seguretat_alimentaria/consells_sobre_seguretat_alimentaria/consells-en-casos-demergencia/consells-en-cas-de-talls-delectricitat/index.html',
    language: 'es',
  },
  proteccionCivilRecommendations: {
    organisation: PROTECCION_CIVIL,
    title: 'Recomendaciones ante riesgos',
    url: 'https://www.proteccioncivil.es/gestion-riesgos/recomendaciones',
    language: 'es',
  },
  proteccionCivilEsAlert: {
    organisation: PROTECCION_CIVIL,
    title: 'Sistema de alerta a la población (ES-Alert)',
    url: 'https://www.proteccioncivil.es/coordinacion/redes/ran/public-warning-system',
    language: 'es',
  },
  proteccionCivilFloods: {
    organisation: PROTECCION_CIVIL,
    title: 'Inundaciones',
    url: 'https://www.proteccioncivil.es/coordinacion/gestion-de-riesgos/hidrologicos/inundaciones',
    language: 'es',
  },
  euPreparedness: {
    organisation: 'Comisión Europea',
    title: 'Estrategia para una Unión de la Preparación',
    url: 'https://commission.europa.eu/topics/preparedness_en',
    language: 'en',
  },
  boeBlackout: {
    organisation: 'Boletín Oficial del Estado',
    title: 'Orden INT/399/2025, de 28 de abril: emergencia de interés nacional por el apagón',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-8486',
    language: 'es',
  },
  gencatPrepare: {
    organisation: GENCAT_PC,
    title: 'Prepárate para las emergencias',
    url: `${GENCAT}/preparat_per_les_emergencies/index.html`,
    language: 'es',
  },
  gencatFamilyPlan: {
    organisation: GENCAT_PC,
    title: "Pla d'emergència familiar",
    url: `${GENCAT_CA}/preparat_per_les_emergencies/pla-demergencia-familiar/index.html`,
    language: 'ca',
  },
  gencatKit: {
    organisation: GENCAT_PC,
    title: 'Kit de emergencias',
    url: `${GENCAT}/preparat_per_les_emergencies/equip_emergencies/index.html`,
    language: 'es',
  },
  gencatChemical: {
    organisation: GENCAT_PC,
    title: 'Riesgo químico',
    url: `${GENCAT}/riscos_tecnologics/risc_quimic/index.html`,
    language: 'es',
  },
  gencatChemicalFaq: {
    organisation: GENCAT_PC,
    title: 'Preguntas frecuentes sobre el riesgo químico',
    url: `${GENCAT}/riscos_tecnologics/risc_quimic/faqs-risc-quimic/index.html`,
    language: 'es',
  },
  gencatNuclear: {
    organisation: GENCAT_PC,
    title: 'Accidente nuclear',
    url: `${GENCAT}/riscos_tecnologics/accident_nuclear/index.html`,
    language: 'es',
  },
  gencatHeavyRain: {
    organisation: GENCAT_PC,
    title: 'Fuertes lluvias',
    url: `${GENCAT}/riscos_naturals/aiguats_i_inundacions/fortes-pluges/index.html`,
    language: 'es',
  },
  gencatForestFire: {
    organisation: GENCAT_PC,
    title: 'Incendios forestales',
    url: `${GENCAT}/riscos_naturals/incendi_del_bosc/index.html`,
    language: 'es',
  },
  gencatHeat: {
    organisation: GENCAT_PC,
    title: 'Calor intenso',
    url: `${GENCAT}/riscos_naturals/onada_de_calor/index.html`,
    language: 'es',
  },
  gencatSnow: {
    organisation: GENCAT_PC,
    title: 'Nevadas, heladas y olas de frío',
    url: `${GENCAT}/riscos_naturals/nevades_glacades_i_onades_de_fred/index.html`,
    language: 'es',
  },
  gencatEarthquake: {
    organisation: GENCAT_PC,
    title: 'Seísmos',
    url: `${GENCAT}/riscos_naturals/sismes/index.html`,
    language: 'es',
  },
  gencatStorms: {
    organisation: GENCAT_PC,
    title: 'Tormentas y rayos',
    url: `${GENCAT}/riscos_naturals/tempestes_electriques/index.html`,
    language: 'es',
  },
  gencatWind: {
    organisation: GENCAT_PC,
    title: 'Fuertes vientos',
    url: `${GENCAT}/riscos_naturals/ventades/index.html`,
    language: 'es',
  },
  gencatCarbonMonoxide: {
    organisation: GENCAT_PC,
    title: 'Evita las intoxicaciones por monóxido de carbono',
    url: `${GENCAT}/mes_consells_dautoproteccio/intoxicacio_co/index.html`,
    language: 'es',
  },
  gencatHomeSafety: {
    organisation: GENCAT_PC,
    title: 'Seguridad en el hogar',
    url: `${GENCAT}/mes_consells_dautoproteccio/seguretat_a_la_llar/index.html`,
    language: 'es',
  },
  gencatHouseFire: {
    organisation: 'Bombers de la Generalitat de Catalunya',
    title: '¿Cómo tenemos que actuar en caso de incendio en casa?',
    url: 'https://interior.gencat.cat/es/arees_dactuacio/bombers/seguretat_a_la_llar_en_cas_dincendi/com_hem_d_actuar_en_cas_dincendi/index.html',
    language: 'es',
  },
  gencat112: {
    organisation: 'Generalitat de Catalunya',
    title: 'Teléfono de emergencias 112',
    url: 'https://web.gencat.cat/es/ciutadania/atenem/telefon-112',
    language: 'es',
  },
  euskadi112: {
    organisation: 'Euskadi 112 SOS Deiak',
    title: 'Cómo llamar al 112',
    url: 'https://www.euskadi.eus/web01-a2larri/es/contenidos/informacion/como_llamar_112/es_recom_ca/index.shtml',
    language: 'es',
  },
  euskadiChemical: {
    organisation: 'Euskadi 112 SOS Deiak',
    title: 'Recomendaciones ante una emergencia química',
    url: 'https://www.euskadi.eus/recomendaciones-riesgo-quimico/web01-a2larri/es/',
    language: 'es',
  },
  cv112Floods: {
    organisation: '112 Comunitat Valenciana',
    title: '¿Qué hacer frente a una inundación?',
    url: 'https://www.112cv.gva.es/es/que-hacer-frente-a-una-inundacion',
    language: 'es',
  },
  gvaAfterFlood: {
    organisation: 'Conselleria de Sanidad de la Generalitat Valenciana',
    title: 'Recomendaciones de salud pública tras las inundaciones',
    url: 'https://www.san.gva.es/es/web/sanidad/actuaciones-dana/salud-publica',
    language: 'es',
  },
  gvaFloodWater: {
    organisation: 'Conselleria de Sanidad de la Generalitat Valenciana',
    title: 'Seguridad alimentaria y agua de bebida en inundaciones',
    url: 'https://www.san.gva.es/es/web/sanidad/recomanacions-de-seguretat-aliment%C3%A0ria-als-consumidors-per-a-reduir-el-risc-en-inundacions',
    language: 'es',
  },
  andalucia112: {
    organisation: 'Junta de Andalucía (112 Andalucía)',
    title: 'Qué hacer en situaciones de emergencia',
    url: 'https://www.juntadeandalucia.es/temas/seguridad/emergencias/que-hacer.html',
    language: 'es',
  },
  madridGas: {
    organisation: MADRID,
    title: 'El gas, siempre con seguridad',
    url: 'https://www.comunidad.madrid/energia/gas-siempre-seguridad',
    language: 'es',
  },
  madridHouseFire: {
    organisation: MADRID,
    title: 'Incendios domésticos',
    url: 'https://www.comunidad.madrid/seguridad-emergencias-asem-112/incendios-domesticos',
    language: 'es',
  },
  madridAdverseWeather: {
    organisation: MADRID,
    title: 'Meteorología adversa',
    url: 'https://www.comunidad.madrid/seguridad-emergencias-asem-112/meteorologia-adversa',
    language: 'es',
  },
  dgtRoadEmergencies: {
    organisation: 'Dirección General de Tráfico (DGT)',
    title: 'Emergencias en carretera: ¿sabe qué hacer?',
    url: 'https://www.dgt.es/comunicacion/noticias/20250605-emergencias-en-carretera-sabe-que-hacer/',
    language: 'es',
  },
  aemetWarnings: {
    organisation: 'Agencia Estatal de Meteorología (AEMET)',
    title: 'Avisos meteorológicos',
    url: 'https://www.aemet.es/es/eltiempo/prediccion/avisos',
    language: 'es',
  },
  ignEarthquake: {
    organisation: 'Instituto Geográfico Nacional',
    title: 'Qué hacer en caso de terremoto',
    url: 'https://www.ign.es/web/resources/sismologia/qhacer/qhacer.html',
    language: 'es',
  },
} as const satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
