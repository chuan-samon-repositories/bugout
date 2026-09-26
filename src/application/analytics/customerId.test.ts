import { describe, expect, it } from 'vitest';
import { pseudonymousCustomerId } from './customerId';

describe('pseudonymousCustomerId', () => {
  it('is stable across case and whitespace and never contains the email', async () => {
    const a = await pseudonymousCustomerId('Ana@Example.es ');
    const b = await pseudonymousCustomerId('ana@example.es');
    expect(a).toBe(b);
    expect(a).toMatch(/^cust_[0-9a-f]{32}$/);
    expect(a).not.toContain('ana');
  });

  it('differs between customers', async () => {
    expect(await pseudonymousCustomerId('ana@example.es')).not.toBe(await pseudonymousCustomerId('luis@example.es'));
  });
});
