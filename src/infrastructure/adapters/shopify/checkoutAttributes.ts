import { CAMPAIGN_PARAMETERS, CampaignParameters, CheckoutAttribution } from '@/application/analytics/attribution';

/**
 * Cart attributes that carry a visit's analytics attribution into Shopify's checkout and onto the order
 * (`note_attributes`). The leading underscore hides them from the buyer in checkout. The Shopify custom pixel
 * (`shopify/custom-pixel.js`) reads the two id keys too, so keep them in sync.
 */
export const DISTINCT_ID_ATTRIBUTE = '_ph_distinct_id';
export const SESSION_ID_ATTRIBUTE = '_ph_session_id';
const campaignAttribute = (parameter: string) => `_${parameter}`;

export interface CartAttribute {
  key: string;
  value: string;
}

/** The attributes for `attribution` (none at all without consent, which also clears earlier ones). */
export function toCartAttributes(attribution: CheckoutAttribution): CartAttribute[] {
  const attributes: CartAttribute[] = [];
  if (attribution.distinctId) attributes.push({ key: DISTINCT_ID_ATTRIBUTE, value: attribution.distinctId });
  if (attribution.sessionId) attributes.push({ key: SESSION_ID_ATTRIBUTE, value: attribution.sessionId });
  for (const parameter of CAMPAIGN_PARAMETERS) {
    const value = attribution.campaign[parameter];
    if (value) attributes.push({ key: campaignAttribute(parameter), value });
  }
  return attributes;
}

/** Reads the attribution back from an order's `note_attributes` (`{ name, value }` pairs). */
export function fromOrderAttributes(
  noteAttributes: ReadonlyArray<{ name?: unknown; value?: unknown }> | null | undefined,
): CheckoutAttribution {
  const values = new Map<string, string>();
  for (const attribute of noteAttributes ?? []) {
    if (typeof attribute?.name === 'string' && typeof attribute.value === 'string' && attribute.value.trim()) {
      values.set(attribute.name, attribute.value.trim());
    }
  }
  const campaign: CampaignParameters = {};
  for (const parameter of CAMPAIGN_PARAMETERS) {
    const value = values.get(campaignAttribute(parameter));
    if (value) campaign[parameter] = value;
  }
  return { distinctId: values.get(DISTINCT_ID_ATTRIBUTE), sessionId: values.get(SESSION_ID_ATTRIBUTE), campaign };
}
