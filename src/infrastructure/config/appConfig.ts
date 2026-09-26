import { CommerceProvider } from '@/application/dtos/Checkout';
import { ShopifyConfig } from '@/infrastructure/config/ShopifyConfig';

export interface PostHogConfig {
  apiKey: string;
  apiHost?: string;
}

interface BaseConfig {
  /** Null disables analytics (no-op adapter). */
  posthog: PostHogConfig | null;
  /** Delay of the simulated local backends (orders, newsletter, contact); adapter defaults when omitted. */
  simulatedDelayMs?: number;
}

export type AppConfig =
  | (BaseConfig & { provider: 'local' })
  | (BaseConfig & { provider: 'shopify'; shopify: ShopifyConfig });

/** Raw, possibly missing environment values. */
export interface RawEnv {
  provider?: string;
  shopifyStoreDomain?: string;
  shopifyStorefrontToken?: string;
  shopifyApiVersion?: string;
  posthogKey?: string;
  posthogHost?: string;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const PROVIDERS: readonly CommerceProvider[] = ['local', 'shopify'];

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isProvider(value: string): value is CommerceProvider {
  return (PROVIDERS as readonly string[]).includes(value);
}

/** @throws ConfigurationError for an unknown provider or incomplete Shopify settings */
export function parseConfig(env: RawEnv): AppConfig {
  const provider = clean(env.provider)?.toLowerCase() ?? 'local';
  if (!isProvider(provider)) {
    throw new ConfigurationError(
      `Unknown NEXT_PUBLIC_COMMERCE_PROVIDER "${env.provider}". Use one of: ${PROVIDERS.join(', ')}.`,
    );
  }

  const posthogKey = clean(env.posthogKey);
  const posthog: PostHogConfig | null = posthogKey ? { apiKey: posthogKey, apiHost: clean(env.posthogHost) } : null;

  if (provider === 'local') return { provider, posthog };

  const storeDomain = clean(env.shopifyStoreDomain);
  const storefrontAccessToken = clean(env.shopifyStorefrontToken);
  const missing = [
    storeDomain ? null : 'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN',
    storefrontAccessToken ? null : 'NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN',
  ].filter((name): name is string => name !== null);
  if (!storeDomain || !storefrontAccessToken) {
    const verb = missing.length > 1 ? 'are' : 'is';
    throw new ConfigurationError(`NEXT_PUBLIC_COMMERCE_PROVIDER is "shopify" but ${missing.join(' and ')} ${verb} not set.`);
  }
  return {
    provider,
    posthog,
    shopify: { storeDomain, storefrontAccessToken, apiVersion: clean(env.shopifyApiVersion) },
  };
}

/**
 * Reads the configuration from NEXT_PUBLIC_* variables. Each variable is referenced
 * literally because Next.js only inlines literal `process.env.X` in client bundles.
 */
export function readConfigFromEnv(): AppConfig {
  return parseConfig({
    provider: process.env.NEXT_PUBLIC_COMMERCE_PROVIDER,
    shopifyStoreDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
    shopifyStorefrontToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN,
    shopifyApiVersion: process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION,
    posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}
