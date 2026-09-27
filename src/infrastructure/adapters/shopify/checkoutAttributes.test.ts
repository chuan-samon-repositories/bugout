import { describe, expect, it } from 'vitest';
import { fromOrderAttributes, toCartAttributes } from './checkoutAttributes';
import { EMPTY_ATTRIBUTION, campaignParametersFrom } from '@/application/analytics/attribution';

describe('checkout attributes', () => {
  it('round-trips the attribution through cart attributes and order note attributes', () => {
    const attribution = {
      distinctId: 'visitor-1',
      sessionId: 'session-1',
      campaign: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'kits', gclid: 'Cj0K', wbraid: 'w1' },
    };
    const orderAttributes = toCartAttributes(attribution).map(({ key, value }) => ({ name: key, value }));
    expect(fromOrderAttributes(orderAttributes)).toEqual(attribution);
  });

  it('writes nothing without consent', () => {
    expect(toCartAttributes(EMPTY_ATTRIBUTION)).toEqual([]);
  });

  it('ignores foreign, empty and malformed note attributes', () => {
    expect(
      fromOrderAttributes([{ name: 'gift', value: 'yes' }, { name: '_ph_session_id', value: ' ' }, { name: 1 }, null as never]),
    ).toEqual({ distinctId: undefined, sessionId: undefined, campaign: {} });
    expect(fromOrderAttributes(undefined).campaign).toEqual({});
  });
});

describe('campaignParametersFrom', () => {
  it('keeps UTM tags and Google Ads click ids only', () => {
    expect(campaignParametersFrom('?utm_source=google&utm_medium=cpc&gclid=abc&gbraid=g&fbclid=x&q=1')).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      gclid: 'abc',
      gbraid: 'g',
    });
  });

  it('drops empty and oversized values', () => {
    expect(campaignParametersFrom(`?utm_source=&gclid=${'x'.repeat(201)}`)).toEqual({});
  });
});
