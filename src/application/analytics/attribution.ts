/**
 * Campaign parameters kept from the landing URL, so an order placed in the hosted checkout can be credited to
 * the campaign that brought the visitor (UTM tags, and Google Ads click ids for a later conversion upload).
 */
export const CAMPAIGN_PARAMETERS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gbraid',
  'wbraid',
] as const;

export type CampaignParameter = (typeof CAMPAIGN_PARAMETERS)[number];
export type CampaignParameters = Partial<Record<CampaignParameter, string>>;

/** Longest value kept per parameter; anything longer is not a real tag or click id. */
const MAX_VALUE_LENGTH = 200;

/** The campaign parameters in a URL query string (`?utm_source=google&gclid=…`); unknown keys are ignored. */
export function campaignParametersFrom(search: string): CampaignParameters {
  const query = new URLSearchParams(search);
  const found: CampaignParameters = {};
  for (const key of CAMPAIGN_PARAMETERS) {
    const value = query.get(key)?.trim();
    if (value && value.length <= MAX_VALUE_LENGTH) found[key] = value;
  }
  return found;
}

/**
 * What links a hosted checkout, and the order it produces, to this visitor's analytics. Empty without analytics
 * consent: nothing identifying leaves the site then.
 */
export interface CheckoutAttribution {
  /** The analytics tool's anonymous visitor id. */
  distinctId?: string;
  /** The analytics session id, so the order joins the session (and its entry campaign) that led to it. */
  sessionId?: string;
  campaign: CampaignParameters;
}

export const EMPTY_ATTRIBUTION: CheckoutAttribution = Object.freeze({ campaign: Object.freeze({}) });
