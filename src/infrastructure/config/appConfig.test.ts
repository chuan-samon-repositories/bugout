import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigurationError, SECRET_SHOPIFY_TOKEN_PREFIXES, parseConfig, readConfigFromEnv } from './appConfig';

describe('parseConfig', () => {
  it('defaults to the local provider without analytics', () => {
    expect(parseConfig({})).toEqual({ provider: 'local', posthog: null, environment: 'local' });
    expect(parseConfig({ provider: '  ' })).toEqual({ provider: 'local', posthog: null, environment: 'local' });
  });

  it('reads the deployment environment and release for analytics', () => {
    expect(parseConfig({ appEnv: ' Preview ', appRelease: 'abc1234' })).toMatchObject({
      environment: 'preview',
      release: 'abc1234',
    });
    expect(parseConfig({ appEnv: '', appRelease: '' })).toMatchObject({ environment: 'local', release: undefined });
  });

  it('accepts the provider case-insensitively', () => {
    expect(parseConfig({ provider: ' LOCAL ' }).provider).toBe('local');
  });

  it('reads Shopify settings', () => {
    expect(
      parseConfig({
        provider: 'shopify',
        shopifyStoreDomain: ' bugout.myshopify.com ',
        shopifyStorefrontToken: 'token',
        shopifyApiVersion: '2026-10',
      }),
    ).toEqual({
      provider: 'shopify',
      posthog: null,
      environment: 'local',
      shopify: { storeDomain: 'bugout.myshopify.com', storefrontAccessToken: 'token', apiVersion: '2026-10' },
    });
  });

  it('fails fast for an unknown provider', () => {
    expect(() => parseConfig({ provider: 'magento' })).toThrow(ConfigurationError);
    expect(() => parseConfig({ provider: 'magento' })).toThrow(/Unknown NEXT_PUBLIC_COMMERCE_PROVIDER "magento"/);
  });

  it('fails fast when Shopify is selected without its settings', () => {
    expect(() => parseConfig({ provider: 'shopify' })).toThrow(
      'NEXT_PUBLIC_COMMERCE_PROVIDER is "shopify" but NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN are not set.',
    );
    expect(() => parseConfig({ provider: 'shopify', shopifyStoreDomain: 'x.myshopify.com', shopifyStorefrontToken: ' ' })).toThrow(
      /NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN is not set/,
    );
  });

  it('refuses a secret (Admin or private) Shopify token in the public variable, without echoing it', () => {
    expect(SECRET_SHOPIFY_TOKEN_PREFIXES).toEqual(['shpat_', 'shpss_', 'shpca_', 'shppa_']);
    for (const prefix of SECRET_SHOPIFY_TOKEN_PREFIXES) {
      const token = `${prefix}0123456789abcdef`;
      const parse = () =>
        parseConfig({ provider: 'shopify', shopifyStoreDomain: 'bugout.myshopify.com', shopifyStorefrontToken: ` ${token} ` });
      expect(parse).toThrow(ConfigurationError);
      expect(parse).toThrow(/private or Admin token must never be a NEXT_PUBLIC_ variable/);
      expect(parse).toThrow(new RegExp(`starts with "${prefix}"`));
      expect(parse).not.toThrow(new RegExp(token));
    }
    // A public Storefront token (32 hex characters, no prefix) is accepted.
    expect(
      parseConfig({ provider: 'shopify', shopifyStoreDomain: 'bugout.myshopify.com', shopifyStorefrontToken: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6' })
        .provider,
    ).toBe('shopify');
  });

  it('enables PostHog only when a key is set', () => {
    expect(parseConfig({ posthogKey: 'phc_1' }).posthog).toEqual({ apiKey: 'phc_1', apiHost: undefined });
    expect(parseConfig({ posthogKey: 'phc_1', posthogHost: 'https://eu.i.posthog.com' }).posthog).toEqual({
      apiKey: 'phc_1',
      apiHost: 'https://eu.i.posthog.com',
    });
    expect(parseConfig({ posthogHost: '/ingest' }).posthog).toBeNull();
  });
});

describe('readConfigFromEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads the NEXT_PUBLIC_* variables', () => {
    vi.stubEnv('NEXT_PUBLIC_COMMERCE_PROVIDER', 'shopify');
    vi.stubEnv('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN', 'bugout.myshopify.com');
    vi.stubEnv('NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN', 'token');
    vi.stubEnv('NEXT_PUBLIC_SHOPIFY_API_VERSION', '2026-07');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_key');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', '/ingest');
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_RELEASE', 'abc1234');
    expect(readConfigFromEnv()).toEqual({
      provider: 'shopify',
      posthog: { apiKey: 'phc_key', apiHost: '/ingest' },
      environment: 'production',
      release: 'abc1234',
      shopify: { storeDomain: 'bugout.myshopify.com', storefrontAccessToken: 'token', apiVersion: '2026-07' },
    });
  });

  it('defaults to local when nothing is set', () => {
    vi.stubEnv('NEXT_PUBLIC_COMMERCE_PROVIDER', '');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', '');
    expect(readConfigFromEnv()).toEqual({ provider: 'local', posthog: null, environment: 'local' });
  });
});
