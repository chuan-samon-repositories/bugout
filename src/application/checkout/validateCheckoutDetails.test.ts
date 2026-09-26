import { describe, expect, it } from 'vitest';
import { isValidSpanishPhone, validateCheckoutDetails } from './validateCheckoutDetails';
import { buildCheckoutDetails } from '../testing/checkoutDetails';

describe('validateCheckoutDetails', () => {
  it('accepts complete details', () => {
    expect(validateCheckoutDetails(buildCheckoutDetails(), 'all')).toEqual({});
  });

  it('reports required contact fields', () => {
    const details = buildCheckoutDetails({ customer: { email: '', firstName: ' ', lastName: '', phone: '' } });
    expect(validateCheckoutDetails(details, 'contact')).toEqual({
      'customer.email': 'required',
      'customer.firstName': 'required',
      'customer.lastName': 'required',
    });
  });

  it('rejects an invalid email and phone', () => {
    const details = buildCheckoutDetails({ customer: { email: 'ana@example', phone: '12345' } });
    expect(validateCheckoutDetails(details, 'contact')).toEqual({
      'customer.email': 'invalidEmail',
      'customer.phone': 'invalidPhone',
    });
  });

  it('reports required shipping fields', () => {
    const details = buildCheckoutDetails({ shippingAddress: { address: '', city: '', province: '', postalCode: '' } });
    expect(validateCheckoutDetails(details, 'shipping')).toEqual({
      'shippingAddress.address': 'required',
      'shippingAddress.city': 'required',
      'shippingAddress.province': 'required',
      'shippingAddress.postalCode': 'required',
    });
  });

  it('validates Spanish postal codes', () => {
    for (const postalCode of ['01001', '28013', '50006', ' 08001 ', '07001']) {
      expect(validateCheckoutDetails(buildCheckoutDetails({ shippingAddress: { postalCode } }), 'shipping')).toEqual({});
    }
    for (const postalCode of ['00123', '53001', '99999', '2801', '280133', 'ABCDE']) {
      expect(validateCheckoutDetails(buildCheckoutDetails({ shippingAddress: { postalCode } }), 'shipping')).toEqual({
        'shippingAddress.postalCode': 'invalidPostalCode',
      });
    }
  });

  it('rejects postal codes outside the IVA territory (Canarias, Ceuta, Melilla)', () => {
    for (const postalCode of ['35001', '38001', '51001', '52001']) {
      expect(validateCheckoutDetails(buildCheckoutDetails({ shippingAddress: { postalCode } }), 'shipping')).toEqual({
        'shippingAddress.postalCode': 'unsupportedRegion',
      });
    }
    for (const postalCode of ['07001', '28013', '50001']) {
      expect(validateCheckoutDetails(buildCheckoutDetails({ shippingAddress: { postalCode } }), 'shipping')).toEqual({});
    }
  });

  it('only ships to Spain', () => {
    expect(validateCheckoutDetails(buildCheckoutDetails({ shippingAddress: { country: 'FR' } }), 'shipping')).toEqual({
      'shippingAddress.country': 'required',
    });
    expect(validateCheckoutDetails(buildCheckoutDetails({ shippingAddress: { country: 'es' } }), 'shipping')).toEqual({});
  });

  it('only checks the fields of the requested step', () => {
    const details = buildCheckoutDetails({ customer: { email: '' }, shippingAddress: { city: '' } });
    expect(Object.keys(validateCheckoutDetails(details, 'contact'))).toEqual(['customer.email']);
    expect(Object.keys(validateCheckoutDetails(details, 'shipping'))).toEqual(['shippingAddress.city']);
    expect(Object.keys(validateCheckoutDetails(details, 'all'))).toEqual(['customer.email', 'shippingAddress.city']);
  });
});

describe('isValidSpanishPhone', () => {
  it('accepts Spanish numbers with common formatting and prefixes', () => {
    for (const phone of ['612345678', '612 34 56 78', '912-345-678', '+34 612 345 678', '0034612345678', '+34.712.345.678', '812345678']) {
      expect(isValidSpanishPhone(phone)).toBe(true);
    }
  });

  it('rejects numbers that are not 9 digits starting with 6–9', () => {
    for (const phone of ['512345678', '61234567', '6123456789', '+33 612 345 678', 'abcdefghi', '+34']) {
      expect(isValidSpanishPhone(phone)).toBe(false);
    }
  });
});
