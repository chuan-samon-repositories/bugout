import { CommerceProvider } from '@/application/dtos/Checkout';
import { ShopifyConfig } from '@/infrastructure/config/ShopifyConfig';

export interface PostHogConfig {
  apiKey: string;
  apiHost?: string;
}

interface BaseConfig {
  /** Null disables analytics (no-op adapter). */
  posthog: PostHogConfig | null;
  /**
   * Deployment environment: Vercel's `production` or `preview`, or `local` outside Vercel. Sent with every
   * analytics event as `app_env`, so test-site and local traffic can be filtered out.
   */
  environment?: string;
  /** Short commit SHA of the deployment, when known (`app_release` on analytics events). */
  release?: string;
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
  appEnv?: string;
  appRelease?: string;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const PROVIDERS: readonly CommerceProvider[] = ['local', 'shopify'];

/**
 * Prefixes of Shopify secret tokens (Admin API access token, app shared secret, custom and
 * private app tokens). The public Storefront token has none of them.
 */
export const SECRET_SHOPIFY_TOKEN_PREFIXES = ['shpat_', 'shpss_', 'shpca_', 'shppa_'] as const;

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isProvider(value: string): value is CommerceProvider {
  return (PROVIDERS as readonly string[]).includes(value);
}

/** @throws ConfigurationError for an unknown provider, incomplete Shopify settings or a secret Shopify token */
export function parseConfig(env: RawEnv): AppConfig {
  const provider = clean(env.provider)?.toLowerCase() ?? 'local';
  if (!isProvider(provider)) {
    throw new ConfigurationError(
      `Unknown NEXT_PUBLIC_COMMERCE_PROVIDER "${env.provider}". Use one of: ${PROVIDERS.join(', ')}.`,
    );
  }

  const posthogKey = clean(env.posthogKey);
  const posthog: PostHogConfig | null = posthogKey ? { apiKey: posthogKey, apiHost: clean(env.posthogHost) } : null;

  const deployment = { environment: clean(env.appEnv)?.toLowerCase() ?? 'local', release: clean(env.appRelease) };

  if (provider === 'local') return { provider, posthog, ...deployment };

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
  const secretPrefix = SECRET_SHOPIFY_TOKEN_PREFIXES.find((prefix) => storefrontAccessToken.startsWith(prefix));
  if (secretPrefix) {
    // Never echo the token: the message may end up in build logs.
    throw new ConfigurationError(
      `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN starts with "${secretPrefix}", which is a secret Shopify token ` +
        '(Admin API or private). NEXT_PUBLIC_ variables are published in the browser bundle, so a private or ' +
        'Admin token must never be a NEXT_PUBLIC_ variable. Use the public Storefront API token of the Headless ' +
        'channel, and revoke the exposed token in Shopify.',
    );
  }
  return {
    provider,
    posthog,
    ...deployment,
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
    // Set in next.config.ts from Vercel's VERCEL_ENV and VERCEL_GIT_COMMIT_SHA at build time.
    appEnv: process.env.NEXT_PUBLIC_APP_ENV,
    appRelease: process.env.NEXT_PUBLIC_APP_RELEASE,
  });
}
