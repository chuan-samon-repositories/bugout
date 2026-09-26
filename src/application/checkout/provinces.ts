/**
 * Provinces the store ships to (peninsula and the Balearic Islands) with their INE
 * code, which is also the first two digits of every postal code in the province.
 * Las Palmas (35), Santa Cruz de Tenerife (38), Ceuta (51) and Melilla (52) are
 * excluded (see NON_SHIPPABLE_POSTAL_PREFIXES). Names match the checkout form's
 * province list, in Spanish alphabetical order.
 */
export const SHIPPABLE_PROVINCES: readonly { readonly name: string; readonly postalPrefix: string }[] = [
  { name: 'A Coruña', postalPrefix: '15' },
  { name: 'Álava', postalPrefix: '01' },
  { name: 'Albacete', postalPrefix: '02' },
  { name: 'Alicante', postalPrefix: '03' },
  { name: 'Almería', postalPrefix: '04' },
  { name: 'Asturias', postalPrefix: '33' },
  { name: 'Ávila', postalPrefix: '05' },
  { name: 'Badajoz', postalPrefix: '06' },
  { name: 'Barcelona', postalPrefix: '08' },
  { name: 'Bizkaia', postalPrefix: '48' },
  { name: 'Burgos', postalPrefix: '09' },
  { name: 'Cáceres', postalPrefix: '10' },
  { name: 'Cádiz', postalPrefix: '11' },
  { name: 'Cantabria', postalPrefix: '39' },
  { name: 'Castellón', postalPrefix: '12' },
  { name: 'Ciudad Real', postalPrefix: '13' },
  { name: 'Córdoba', postalPrefix: '14' },
  { name: 'Cuenca', postalPrefix: '16' },
  { name: 'Gipuzkoa', postalPrefix: '20' },
  { name: 'Girona', postalPrefix: '17' },
  { name: 'Granada', postalPrefix: '18' },
  { name: 'Guadalajara', postalPrefix: '19' },
  { name: 'Huelva', postalPrefix: '21' },
  { name: 'Huesca', postalPrefix: '22' },
  { name: 'Illes Balears', postalPrefix: '07' },
  { name: 'Jaén', postalPrefix: '23' },
  { name: 'La Rioja', postalPrefix: '26' },
  { name: 'León', postalPrefix: '24' },
  { name: 'Lleida', postalPrefix: '25' },
  { name: 'Lugo', postalPrefix: '27' },
  { name: 'Madrid', postalPrefix: '28' },
  { name: 'Málaga', postalPrefix: '29' },
  { name: 'Murcia', postalPrefix: '30' },
  { name: 'Navarra', postalPrefix: '31' },
  { name: 'Ourense', postalPrefix: '32' },
  { name: 'Palencia', postalPrefix: '34' },
  { name: 'Pontevedra', postalPrefix: '36' },
  { name: 'Salamanca', postalPrefix: '37' },
  { name: 'Segovia', postalPrefix: '40' },
  { name: 'Sevilla', postalPrefix: '41' },
  { name: 'Soria', postalPrefix: '42' },
  { name: 'Tarragona', postalPrefix: '43' },
  { name: 'Teruel', postalPrefix: '44' },
  { name: 'Toledo', postalPrefix: '45' },
  { name: 'Valencia', postalPrefix: '46' },
  { name: 'Valladolid', postalPrefix: '47' },
  { name: 'Zamora', postalPrefix: '49' },
  { name: 'Zaragoza', postalPrefix: '50' },
];

const PROVINCE_BY_PREFIX = new Map(SHIPPABLE_PROVINCES.map((province) => [province.postalPrefix, province.name]));

/**
 * Name of the shippable province a postal code belongs to (by its first two digits),
 * or null when the code is not five digits or belongs to no shippable province.
 */
export function provinceForPostalCode(code: string): string | null {
  const trimmed = code.trim();
  if (!/^\d{5}$/.test(trimmed)) return null;
  return PROVINCE_BY_PREFIX.get(trimmed.slice(0, 2)) ?? null;
}
