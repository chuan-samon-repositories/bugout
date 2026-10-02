import { ShopifyConfig } from '@/infrastructure/config/ShopifyConfig';

export const DEFAULT_SHOPIFY_API_VERSION = '2026-07';

/**
 * Directive added to every Storefront operation so prices, availability and
 * translations are resolved for the Spanish market (EUR, IVA included) in Spanish.
 */
export const STOREFRONT_CONTEXT = '@inContext(country: ES, language: ES)';

/** Seconds a catalog query may be served from the Next.js data cache on the server. */
export const CATALOG_REVALIDATE_SECONDS = 300;

export interface ShopifyUserError {
  field?: string[] | null;
  message: string;
  code?: string | null;
}

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: GraphQLError[];
}

export class ShopifyApiError extends Error {
  constructor(
    message: string,
    readonly details: { status?: number; errors?: readonly GraphQLError[]; userErrors?: readonly ShopifyUserError[] } = {},
  ) {
    super(message);
    this.name = 'ShopifyApiError';
  }
}

/** RequestInit plus the Next.js data-cache options (ignored outside Next.js). */
export type ShopifyRequestInit = RequestInit & { next?: { revalidate?: number | false } };

export type FetchLike = (url: string, init: ShopifyRequestInit) => Promise<Response>;

export interface ShopifyRequestOptions {
  /**
   * Bypasses every cache (`cache: 'no-store'`). Use for cart reads, which are
   * per-visitor and must be fresh. Mutations always bypass caches.
   */
  noStore?: boolean;
}

const MUTATION_OPERATION = /^\s*mutation\b/;

/**
 * Pauses before each retry of a query that failed on the way (network error, HTTP 429 or 5xx). One dropped
 * connection while prerendering the catalog would otherwise fail the whole build. Mutations are never retried:
 * Shopify may have applied one whose answer was lost.
 */
export const QUERY_RETRY_DELAYS_MS: readonly number[] = [250, 1000];

const RETRYABLE_STATUS = (status: number) => status === 429 || status >= 500;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Minimal Storefront API GraphQL client shared by all Shopify adapters. */
export class ShopifyClient {
  readonly endpoint: string;
  private readonly headers: Record<string, string>;

  constructor(
    config: ShopifyConfig,
    private readonly fetchImpl?: FetchLike,
    private readonly retryDelaysMs: readonly number[] = QUERY_RETRY_DELAYS_MS,
  ) {
    const domain = config.storeDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    this.endpoint = `https://${domain}/api/${config.apiVersion ?? DEFAULT_SHOPIFY_API_VERSION}/graphql.json`;
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
    };
  }

  /**
   * Sends one GraphQL operation. Queries may be cached by Next.js on the server for
   * CATALOG_REVALIDATE_SECONDS; mutations and `noStore` requests are never cached.
   * Queries that fail on the way are retried after each of `retryDelaysMs`; mutations are sent once.
   * @throws ShopifyApiError on network failures, non-2xx responses and top-level GraphQL errors
   */
  async request<T>(query: string, variables: Record<string, unknown> = {}, options: ShopifyRequestOptions = {}): Promise<T> {
    const doFetch = this.fetchImpl ?? fetch;
    const mutation = MUTATION_OPERATION.test(query);
    const caching: ShopifyRequestInit =
      options.noStore || mutation ? { cache: 'no-store' } : { next: { revalidate: CATALOG_REVALIDATE_SECONDS } };
    const retryDelays = mutation ? [] : this.retryDelaysMs;
    let response: Response;
    for (let attempt = 0; ; attempt++) {
      const canRetry = attempt < retryDelays.length;
      try {
        response = await doFetch(this.endpoint, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ query, variables }),
          ...caching,
        });
      } catch (error) {
        if (canRetry) {
          await wait(retryDelays[attempt]);
          continue;
        }
        throw new ShopifyApiError(`Shopify request failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (canRetry && RETRYABLE_STATUS(response.status)) {
        await response.body?.cancel().catch(() => undefined);
        await wait(retryDelays[attempt]);
        continue;
      }
      break;
    }

    if (!response.ok) {
      throw new ShopifyApiError(`Shopify API responded with HTTP ${response.status} ${response.statusText}`.trim(), {
        status: response.status,
      });
    }

    let body: GraphQLResponse<T>;
    try {
      body = (await response.json()) as GraphQLResponse<T>;
    } catch {
      throw new ShopifyApiError('Shopify API returned invalid JSON', { status: response.status });
    }

    if (body.errors && body.errors.length > 0) {
      throw new ShopifyApiError(`Shopify GraphQL error: ${body.errors.map((error) => error.message).join('; ')}`, {
        status: response.status,
        errors: body.errors,
      });
    }
    if (!body.data) {
      throw new ShopifyApiError('Shopify API response has no data', { status: response.status });
    }
    return body.data;
  }
}

/** @throws ShopifyApiError when a mutation reports user errors */
export function assertNoUserErrors(operation: string, userErrors: readonly ShopifyUserError[] | null | undefined): void {
  if (userErrors && userErrors.length > 0) {
    throw new ShopifyApiError(`${operation} failed: ${userErrors.map((error) => error.message).join('; ')}`, { userErrors });
  }
}
